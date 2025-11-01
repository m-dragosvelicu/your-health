import "server-only";

import { randomBytes, createHash } from "node:crypto";

import { createTransport } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

import { db } from "~/server/db";
import { env } from "~/env";

const RESET_IDENTIFIER_PREFIX = "password-reset:";
const RESET_TOKEN_EXPIRATION_MINUTES = 60;

const transportOptions: SMTPTransport.Options = {
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
};

if (env.NODE_ENV !== "production") {
  console.info("[password-reset] Transport config", transportOptions);
}

const transporter = createTransport(transportOptions);

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

type ResetEmailPayload = {
  email: string;
  resetUrl: string;
  expires: Date;
  userName?: string | null;
};

function createResetEmail({ email, resetUrl, expires, userName }: ResetEmailPayload) {
  const displayName = userName?.trim() ?? "there";
  const text = [
    `Hi ${displayName},`,
    "",
    "We received a request to reset the password for your Health Tracker account.",
    "If you made this request, you can set a new password using the link below:",
    resetUrl,
    "",
    `This link will expire on ${expires.toUTCString()}. If you did not request a password reset, you can safely ignore this email.`,
    "",
    "For security reasons the link can be used only once.",
    "",
    "Stay healthy,\nHealth Tracker Team",
  ].join("\n");

  const html = `
    <p>Hi ${displayName},</p>
    <p>We received a request to reset the password for your Health Tracker account.</p>
    <p>If you made this request, click the button below to choose a new password. This link will expire on <strong>${expires.toUTCString()}</strong>.</p>
    <p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">
        Reset password
      </a>
    </p>
    <p>If you did not request a password reset, you can safely ignore this email. For security reasons the link works only once.</p>
    <p>Stay healthy,<br/>Health Tracker Team</p>
  `;

  return { text, html, subject: "Reset your Health Tracker password", to: email };
}

export async function createPasswordResetToken(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const identifier = `${RESET_IDENTIFIER_PREFIX}${normalizedEmail}`;

  await db.verificationToken.deleteMany({ where: { identifier } });

  const token = randomBytes(32).toString("hex");
  const hashedToken = hashToken(token);
  const expires = new Date(Date.now() + RESET_TOKEN_EXPIRATION_MINUTES * 60 * 1000);

  await db.verificationToken.create({
    data: {
      identifier,
      token: hashedToken,
      expires,
    },
  });

  return { token, expires };
}

export async function consumePasswordResetToken(email: string, token: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const identifier = `${RESET_IDENTIFIER_PREFIX}${normalizedEmail}`;
  const hashedToken = hashToken(token);

  const record = await db.verificationToken.findUnique({
    where: { identifier_token: { identifier, token: hashedToken } },
  });

  if (!record) {
    return { valid: false as const };
  }

  const isExpired = record.expires.getTime() <= Date.now();

  await db.verificationToken.delete({
    where: { identifier_token: { identifier, token: hashedToken } },
  });

  if (isExpired) {
    return { valid: false as const };
  }

  // Resolve userId by email from User first; if absent, fall back to Credentials
  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  let userId: string | null = user?.id ?? null;
  if (!userId) {
    const cred = await db.credentials.findUnique({
      where: { email: normalizedEmail },
      select: { userId: true },
    });
    userId = cred?.userId ?? null;
  }

  if (!userId) {
    return { valid: false as const };
  }

  return { valid: true as const, userId };
}

// export async function sendPasswordResetEmail(payload: ResetEmailPayload) {
//   const message = createResetEmail(payload);

//   await transporter.sendMail({
//     from: env.EMAIL_FROM,
//     to: message.to,
//     subject: message.subject,
//     text: message.text,
//     html: message.html,
//   });

//   if (env.NODE_ENV !== "production") {
//     console.info(
//       `[password-reset] Sent reset email to ${payload.email}: ${payload.resetUrl}`,
//     );
//   }
// }

export async function sendPasswordResetEmail(payload: ResetEmailPayload) {
  const message = createResetEmail(payload);

  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  } catch (err) {
    console.error("[password-reset] Failed to send reset email", err);
    throw err;
  }

  if (env.NODE_ENV !== "production") {
    console.info(`[password-reset] Sent reset email to ${payload.email}: ${payload.resetUrl}`);
  }
}
