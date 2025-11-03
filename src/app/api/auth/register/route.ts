// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/shared/server/db";
import { rateLimitOrThrow, recordAttempt } from "@/shared/server/security/rate-limit";
import { getClientIp } from "@/shared/server/http/ip";

const RegisterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().transform((e) => e.trim().toLowerCase()),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // Parse the body ONCE (strict-typing and normalization via Zod)
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    // Unreadable body → count as a failed registration attempt
    await recordAttempt({ action: "register", email: undefined, ip }, false);
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = RegisterSchema.safeParse(json);
  if (!parsed.success) {
    // If body had an email, log with it; else undefined
    const maybeEmail =
      typeof (json as Record<string, unknown>)?.email === "string"
        ? ((json as Record<string, unknown>).email as string).trim().toLowerCase()
        : undefined;

    await recordAttempt({ action: "register", email: maybeEmail, ip }, false);
    return NextResponse.json(
      { ok: false, error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  try {
    // Throttle by email + IP (sliding window)
    await rateLimitOrThrow(
      { action: "register", email, ip },
      { windowMinutes: 10, maxAttempts: 10 },
    );

    // Reject if credentials already exist for this email
    const existingCred = await db.credentials.findUnique({ where: { email } });
    if (existingCred) {
      await recordAttempt({ action: "register", email, ip }, false);
      return NextResponse.json(
        { ok: false, error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    // Attach to existing OAuth user or create a fresh User
    const existingUser = await db.user.findUnique({ where: { email } });
    const passwordHash = await bcrypt.hash(password, 12);

    const userId =
      existingUser?.id ??
      (
        await db.user.create({
          data: { email, name: name ?? null },
          select: { id: true },
        })
      ).id;

    // Persist credentials (hash only)
    await db.credentials.create({
      data: { userId, email, passwordHash },
    });

    await recordAttempt({ action: "register", email, ip }, true);
    return NextResponse.json({ ok: true, userId }, { status: 201 });
  } catch (err) {
    // Rate limit errors bubble as HttpError(429); others are 500
    const status =
      typeof (err as { status?: number })?.status === "number"
        ? (err as { status: number }).status
        : 500;

    await recordAttempt({ action: "register", email, ip }, false);

    if (status === 429) {
      return NextResponse.json(
        { ok: false, error: "Too many attempts. Please try again later." },
        { status },
      );
    }

    console.error("[REGISTER_POST]", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status },
    );
  }
}
