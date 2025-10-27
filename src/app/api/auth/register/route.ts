import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "~/server/db";
import { rateLimitOrThrow, recordAttempt } from "~/server/security/rate-limit";

const RegisterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().transform(e => e.trim().toLowerCase()),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  try {
    const json = await req.json() as z.infer<typeof RegisterSchema>;
    const parsed = RegisterSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid payload", issues: parsed.error.flatten() },
      );
    }
    const { name, email, password } = parsed.data;

    await rateLimitOrThrow(
      {action: "register", email, ip},
      {windowMinutes: 10, maxAttempts: 10},
    );


    const existingCred = await db.credentials.findUnique({ where: { email } });
    if (existingCred) {
      return NextResponse.json(
        { ok: false, error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const existingUser = await db.user.findUnique({ where: { email } });

    const passwordHash = await bcrypt.hash(password, 12);

    const userId =
      existingUser?.id ?? (
        await db.user.create({
          data: {
            email,
            name: name ?? null,
          },
          select: { id: true },
        })
      ).id;

    await db.credentials.create({
      data: {
        userId,
        email,
        passwordHash,
      },
    });

    await recordAttempt({action: "register", email, ip}, true); 
    return NextResponse.json({ ok: true, userId }, { status: 201 });

  } catch (err) {
    try{
      const body = await req.json().catch(() => ({})) as Partial<z.infer<typeof RegisterSchema>>;
      const email = (body?.email ?? "").toString().toLowerCase();
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
      await recordAttempt({ action: "register", email, ip }, false);
    }catch{}

    console.error("[REGISTER_POST]", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
