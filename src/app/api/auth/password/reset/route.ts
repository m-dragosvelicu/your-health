import { NextResponse } from "next/server";
import { z } from "zod";

import { createPasswordResetToken, sendPasswordResetEmail } from "~/server/auth/password-reset";
import { db } from "~/server/db";
import { getClientIp } from "~/server/http/ip";
import { HttpError, rateLimitOrThrow, recordAttempt } from "~/server/security/rate-limit";

const PasswordResetRequestSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
});

function resolveBaseUrl(raw: string | null): URL {
  const fallback = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const candidate = raw ?? fallback;

  try {
    return new URL(candidate);
  } catch {
    return new URL(fallback);
  }
}

export async function POST(req: Request) {
  const ip = getClientIp(req);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    await recordAttempt({ action: "password-reset-request", email: undefined, ip }, false);
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = PasswordResetRequestSchema.safeParse(json);
  if (!parsed.success) {
    const maybeEmail =
      typeof (json as Record<string, unknown>)?.email === "string"
        ? ((json as Record<string, unknown>).email as string).trim().toLowerCase()
        : undefined;

    await recordAttempt({ action: "password-reset-request", email: maybeEmail, ip }, false);
    return NextResponse.json(
      { ok: false, error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email } = parsed.data;

  try {
    // await rateLimitOrThrow(
    //   { action: "password-reset-request", email, ip },
    //   { windowMinutes: 15, maxAttempts: 5 },
    // );

    // Determine if an account exists either directly in User or via Credentials
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true },
    });

    let shouldSend = false;
    let userName: string | null = user?.name ?? null;
    if (user) {
      shouldSend = true;
    } else {
      const cred = await db.credentials.findUnique({
        where: { email },
        select: { userId: true },
      });
      if (cred) {
        shouldSend = true;
        // Try to fetch a display name for nicer email content
        const u = await db.user.findUnique({ where: { id: cred.userId }, select: { name: true } });
        userName = u?.name ?? null;
      }
    }

    if (shouldSend) {
      const { token, expires } = await createPasswordResetToken(email);
      const baseUrl = resolveBaseUrl(req.headers.get("origin") ?? req.headers.get("referer"));
      const resetUrl = new URL("/auth", baseUrl);
      resetUrl.searchParams.set("mode", "reset-password");
      resetUrl.searchParams.set("token", token);
      resetUrl.searchParams.set("email", email);

      await sendPasswordResetEmail({
        email,
        resetUrl: resetUrl.toString(),
        expires,
        userName,
      });
    }

    await recordAttempt({ action: "password-reset-request", email, ip }, true);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    await recordAttempt({ action: "password-reset-request", email, ip }, false);

    if (err instanceof HttpError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }

    console.error("[PASSWORD_RESET_REQUEST]", err);
    return NextResponse.json(
      { ok: false, error: "Unable to process password reset request." },
      { status: 500 },
    );
  }
}
