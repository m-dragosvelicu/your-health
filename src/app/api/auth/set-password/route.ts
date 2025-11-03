import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/shared/server/db";
import { auth } from "@/shared/server/auth"; // from src/shared/server/auth/index.ts

const SetPasswordSchema = z.object({
  currentPassword: z.string().min(0).max(100).optional(), // required if already have credentials
  newPassword: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  // 1) Require an authenticated user
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // 2) Validate input
    const body: unknown = await req.json();
    const parsed = SetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { currentPassword, newPassword } = parsed.data;

    // 3) Load user + existing credentials (if any)
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user?.email) {
      // We normalize emails elsewhere; here we just ensure it exists
      return NextResponse.json(
        { ok: false, error: "User has no email on record." },
        { status: 400 },
      );
    }
    const email = user.email.toLowerCase();

    const existingCred = await db.credentials.findUnique({
      where: { email },
    });

    // 4) If credentials already exist, verify currentPassword
    if (existingCred) {
      if (!currentPassword) {
        return NextResponse.json(
          { ok: false, error: "Current password is required." },
          { status: 400 },
        );
      }
      const ok = await bcrypt.compare(currentPassword, existingCred.passwordHash);
      if (!ok) {
        return NextResponse.json(
          { ok: false, error: "Current password is incorrect." },
          { status: 400 },
        );
      }
    }

    // 5) Hash and upsert credentials
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await db.credentials.upsert({
      where: { email },
      update: { passwordHash },
      create: {
        userId,
        email,
        passwordHash,
      },
    });

    // 6) Invalidate all existing sessions for this user (force re-login on other devices)
    await db.session.deleteMany({
      where: { userId },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[SET_PASSWORD_POST]", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
