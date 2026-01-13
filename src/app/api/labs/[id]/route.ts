import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/shared/server/auth";
import { db } from "@/shared/server/db";

export const runtime = "nodejs";

const ParamsSchema = z.object({
  id: z.string().min(1),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const parsed = ParamsSchema.safeParse(await params);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid lab id", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id } = parsed.data;

  const lab = await db.lab.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      tests: {
        orderBy: [{ section: "asc" }, { name: "asc" }],
      },
    },
  });

  if (!lab) {
    return NextResponse.json(
      { ok: false, error: "Lab not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    lab: {
      id: lab.id,
      provider: lab.provider,
      sampledAt: lab.sampledAt,
      resultAt: lab.resultAt,
      createdAt: lab.createdAt,
      patient: {
        first_name: lab.patientFirstName,
        last_name: lab.patientLastName,
        birthdate: lab.patientBirthdate,
      },
      rawFilePath: lab.rawFilePath,
      tests: lab.tests.map((test) => ({
        id: test.id,
        section: test.section,
        name: test.name,
        value: test.value,
        rawValue: test.rawValue,
        unit: test.unit,
        refRaw: test.refRaw,
      })),
    },
  });
}
