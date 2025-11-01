import { subMinutes } from "date-fns";
import { db } from "~/server/db";

type RateAction =
  | "login"
  | "register"
  | "set-password"
  | "password-reset-request"
  | "password-reset-confirm";
type RateKey = {
  email?: string;
  ip?: string | null;
  action: RateAction;
};

type AuthAttemptDelegate = {
  count(args: {
    where: {
      action: RateAction;
      createdAt: { gte: Date };
      email?: string;
      ip?: string;
    };
  }): Promise<number>;
  create(args: {
    data: {
      action: RateAction;
      success: boolean;
      email: string | null;
      ip: string | null;
    };
  }): Promise<unknown>;
};

const prisma = db as typeof db & { authAttempt: AuthAttemptDelegate };

// Typed HTTP error (avoids any/unknown casts)

export class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
/**
 * Throws HttpError(429) when attempts within the window exceed the limit.
 * Counts by email and by IP (if provided) and uses the larger count.
 */

export async function rateLimitOrThrow(
  key: RateKey,
  opts: { windowMinutes: number; maxAttempts: number },
): Promise<void> {
  const since = subMinutes(new Date(), opts.windowMinutes);
  const email = key.email?.toLowerCase();

  const [byEmail, byIp] = await Promise.all([
    email
      ? prisma.authAttempt.count({
        where: { action: key.action, email, createdAt: { gte: since } },
      })
      : Promise.resolve(0),
    key.ip
      ? prisma.authAttempt.count({
        where: {
          action: key.action,
          ip: key.ip,
          createdAt: { gte: since },
        },
      })
      : Promise.resolve(0),
  ]);
  const attempts = Math.max(byEmail, byIp);
  if (attempts >= opts.maxAttempts) {
    throw new HttpError("Too many attempts. Please try again later.", 429);
  }
}
/**
 * Records an auth attempt outcome (success/failure).
 * Best-effort logging; failures here should not block auth flows.
 */
export async function recordAttempt(key: RateKey, success: boolean): Promise<void> {
  const email = key.email?.toLowerCase() ?? null;
  const ip = key.ip ?? null;
  try {
    await prisma.authAttempt.create({
      data: {
        action: key.action,
        success,
        email,
        ip,
      },
    });
  } catch (_: unknown) {
    // Swallow errors; logging can be added if desired.
  }
}
