import { NextResponse } from "next/server";
import { auth } from "@/shared/server/auth";
import { db } from "@/shared/server/db";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const labs = await db.lab.findMany({
    where: { userId: session.user.id },
    orderBy: [{ sampledAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      provider: true,
      sampledAt: true,
      resultAt: true,
      createdAt: true,
      patientFirstName: true,
      patientLastName: true,
      _count: { select: { tests: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    labs: labs.map((lab) => ({
      id: lab.id,
      provider: lab.provider,
      sampledAt: lab.sampledAt,
      resultAt: lab.resultAt,
      createdAt: lab.createdAt,
      patient: {
        first_name: lab.patientFirstName,
        last_name: lab.patientLastName,
      },
      tests_count: lab._count.tests,
    })),
  });
}

export async function POST(req: Request) {
  // For now we don't support POST on /api/labs (upload is handled by /api/labs/upload).
  void req;
  return NextResponse.json(
    { ok: false, error: "Use /api/labs/upload for uploads." },
    { status: 405 },
  );
}
