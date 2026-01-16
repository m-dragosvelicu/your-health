import { NextResponse } from "next/server";
import { auth } from "@/shared/server/auth";
import { db } from "@/shared/server/db";

export const runtime = "nodejs";

/**
 * GET /api/labs/tests
 *
 * Returns all unique test names for the current user
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all distinct test names for this user
    const tests = await db.labTest.findMany({
      where: {
        lab: {
          userId: session.user.id,
        },
      },
      select: {
        name: true,
        unit: true,
        section: true,
      },
      distinct: ["name"],
      orderBy: {
        name: "asc",
      },
    });

    // Group by section for better UX
    const grouped = tests.reduce(
      (acc, test) => {
        const section = test.section ?? "Other";
        const bucket = (acc[section] ??= []);
        bucket.push({
          name: test.name,
          unit: test.unit,
        });
        return acc;
      },
      {} as Record<string, Array<{ name: string; unit: string | null }>>,
    );

    return NextResponse.json({
      ok: true,
      tests: tests.map((t) => ({ name: t.name, unit: t.unit, section: t.section })),
      grouped,
    });
  } catch (err) {
    console.error("[labs-tests] Failed to fetch test names", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch test names" },
      { status: 500 }
    );
  }
}
