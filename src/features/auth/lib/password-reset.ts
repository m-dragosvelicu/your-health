import "server-only";

import { randomBytes, createHash } from "node:crypto";

import { createTransport } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

import { db } from "@/shared/server/db";
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
  requestIp?: string | null;
  requestDevice?: string | null;
  requestedAt?: Date | null;
};

function createResetEmail({
  email,
  resetUrl,
  expires,
  userName,
  requestIp,
  requestDevice,
  requestedAt,
}: ResetEmailPayload) {
  const displayName = userName?.trim() ?? "there";
  const expiryMinutes = Math.max(
    1,
    Math.round((expires.getTime() - Date.now()) / (60 * 1000)),
  );
  const expiryLabel = `Expires in ${expiryMinutes} minute${expiryMinutes === 1 ? "" : "s"}`;
  const resetUtc = expires.toUTCString();

  const requestTimestamp = requestedAt ? requestedAt.toUTCString() : null;
  const requestDetailRows = [
    { label: "IP address", value: requestIp ?? null, placeholder: "{{request_ip}}" },
    { label: "Device", value: requestDevice ?? null, placeholder: "{{request_device}}" },
    { label: "Request time", value: requestTimestamp, placeholder: "{{request_time}}" },
  ];
  const availableDetails = requestDetailRows.filter(
    (row): row is typeof row & { value: string } => typeof row.value === "string" && row.value.length > 0,
  );

  const requestDetailsHtml = availableDetails.length
    ? `<tr>
          <td style="padding:12px 0 0 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="font-weight:600;font-size:14px;line-height:20px;color:#0f172a;">Request details</td>
              </tr>
              ${availableDetails
                .map(
                  (detail) => `<tr>
                    <td style="font-size:14px;line-height:20px;color:#1e293b;">${detail.label}: <span data-placeholder="${detail.placeholder}">${detail.value}</span></td>
                  </tr>`,
                )
                .join("")}
            </table>
          </td>
        </tr>`
    : "";

  const html = `<!DOCTYPE html>
  <html lang="en" style="color-scheme: light dark;">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Reset your password</title>
      <style>
        :root {
          color-scheme: light dark;
        }
        @media (prefers-color-scheme: dark) {
          body {
            background-color: #0f172a !important;
          }
          .email-body {
            background-color: #111827 !important;
            color: #e5e7eb !important;
          }
          .email-text {
            color: #e5e7eb !important;
          }
          .email-muted {
            color: #94a3b8 !important;
          }
          .email-button {
            background-color: #2563eb !important;
          }
        }
        @media only screen and (max-width: 640px) {
          .email-container {
            width: 100% !important;
            margin: 0 auto !important;
          }
          .email-body {
            padding: 24px 20px !important;
          }
        }
      </style>
    </head>
    <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <!-- Implementation notes: Inline styles with {{user_name}}, {{reset_url}}, {{expiry_time}} placeholders for templating -->
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin:0;padding:24px 0;background-color:#f8fafc;">
        <tr>
          <td align="center" style="padding:0 12px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;border-collapse:collapse;" class="email-container">
              <tr>
                <td style="padding:32px 0;text-align:center;">
                  <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'><rect width='64' height='64' rx='12' fill='%232563EB'/><path d='M21 34c8 8 14 8 22 0' stroke='%23ffffff' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/><circle cx='24' cy='24' r='4' fill='%23ffffff'/><circle cx='40' cy='24' r='4' fill='%23ffffff'/></svg>" alt="Health Tracker logo" width="64" height="64" style="display:block;margin:0 auto;" data-placeholder="{{brand_logo}}" />
                </td>
              </tr>
              <tr>
                <td class="email-body" style="background-color:#ffffff;border-radius:20px;padding:40px 48px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
                    <tr>
                      <td style="font-size:28px;line-height:34px;font-weight:700;color:#0f172a;padding-bottom:16px;">Reset your password</td>
                    </tr>
                    <tr>
                      <td class="email-text" style="font-size:16px;line-height:24px;color:#1e293b;padding-bottom:12px;">Hi <span data-placeholder="{{user_name}}">${displayName}</span>,</td>
                    </tr>
                    <tr>
                      <td class="email-text" style="font-size:16px;line-height:24px;color:#1e293b;padding-bottom:12px;">We received a request to reset the password for your Health Tracker account. Use the button below to choose a new password.</td>
                    </tr>
                    <tr>
                      <td style="padding:24px 0;text-align:center;">
                        <a href="${resetUrl}" data-placeholder="{{reset_url}}" class="email-button" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-weight:600;font-size:16px;line-height:24px;padding:14px 32px;border-radius:999px;text-decoration:none;">Reset Password</a>
                      </td>
                    </tr>
                    <tr>
                      <td class="email-muted" style="font-size:14px;line-height:20px;color:#475569;text-align:center;padding-bottom:24px;">If the button above isn&rsquo;t working, copy and paste this link into your browser:<br /><a href="${resetUrl}" data-placeholder="{{backup_reset_url}}" style="color:#2563eb;text-decoration:none;word-break:break-all;">${resetUrl}</a></td>
                    </tr>
                    <tr>
                      <td class="email-text" style="font-size:16px;line-height:24px;color:#1e293b;padding-bottom:12px;"><strong data-placeholder="{{expiry_label}}">${expiryLabel}</strong> (<span data-placeholder="{{expiry_time}}">${resetUtc}</span>)</td>
                    </tr>
                    ${requestDetailsHtml}
                    <tr>
                      <td class="email-muted" style="font-size:14px;line-height:20px;color:#475569;padding-top:24px;">
                        For your security, this link works only once. We recommend choosing a strong, unique password.
                      </td>
                    </tr>
                    <tr>
                      <td class="email-muted" style="font-size:14px;line-height:20px;color:#475569;padding-top:12px;">
                        If you didn&rsquo;t request this reset, you can safely ignore this email and your password will stay the same.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="text-align:center;padding:24px 12px;font-size:12px;line-height:18px;color:#64748b;">
                  Sent to <span data-placeholder="{{recipient_email}}">${email}</span> from Health Tracker.<br />
                  &copy; ${new Date().getFullYear()} Health Tracker. All rights reserved.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;

  const textLines: string[] = [
    "Reset your password",
    `Hi ${displayName},`,
    "",
    "We received a request to reset the password for your Health Tracker account.",
    `Reset link (valid once): ${resetUrl}`,
    `${expiryLabel} (${resetUtc})`,
  ];

  if (availableDetails.length) {
    textLines.push(
      "",
      "Request details:",
      ...availableDetails.map((detail) => `${detail.label}: ${detail.value}`),
    );
  }

  textLines.push(
    "",
    "If you didn't request this reset, ignore this message and your password will remain unchanged.",
    "",
    "Stay healthy,",
    "Health Tracker Team",
  );

  const text = textLines.join("\n");

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
