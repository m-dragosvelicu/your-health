import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { consumePasswordResetToken } from "~/server/auth/password-reset";
import { db } from "~/server/db";
import { getClientIp } from "~/server/http/ip";
import { HttpError, rateLimitOrThrow, recordAttempt } from "~/server/security/rate-limit";

const PasswordResetConfirmSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  token: z.string().min(1).max(256),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    await recordAttempt({ action: "password-reset-confirm", email: undefined, ip }, false);
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = PasswordResetConfirmSchema.safeParse(json);
  if (!parsed.success) {
    const maybeEmail =
      typeof (json as Record<string, unknown>)?.email === "string"
        ? ((json as Record<string, unknown>).email as string).trim().toLowerCase()
        : undefined;

    await recordAttempt({ action: "password-reset-confirm", email: maybeEmail, ip }, false);
    return NextResponse.json(
      { ok: false, error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, password, token } = parsed.data;

  try {
    await rateLimitOrThrow(
      { action: "password-reset-confirm", email, ip },
      { windowMinutes: 15, maxAttempts: 10 },
    );

    const result = await consumePasswordResetToken(email, token);
    if (!result.valid) {
      await recordAttempt({ action: "password-reset-confirm", email, ip }, false);
      return NextResponse.json(
        { ok: false, error: "Reset link is invalid or has expired." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.credentials.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, userId: result.userId, passwordHash },
    });

    await db.session.deleteMany({
      where: { userId: result.userId },
    });

    await recordAttempt({ action: "password-reset-confirm", email, ip }, true);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    await recordAttempt({ action: "password-reset-confirm", email, ip }, false);

    if (err instanceof HttpError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }

    console.error("[PASSWORD_RESET_CONFIRM]", err);
    return NextResponse.json(
      { ok: false, error: "Unable to set a new password." },
      { status: 500 },
    );
  }
}
