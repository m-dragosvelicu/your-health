import { NextResponse } from "next/server";
import { auth } from "@/shared/server/auth";
import { db } from "@/shared/server/db";

export const runtime = "nodejs";

/**
 * GET /api/labs/history?testName=TSH
 *
 * Returns time-series data for a specific lab test across all lab sessions
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const testName = searchParams.get("testName");

  if (!testName) {
    return NextResponse.json(
      { ok: false, error: "Missing testName parameter" },
      { status: 400 }
    );
  }

  try {
    // Get all tests with this name for the current user, ordered by date
    const tests = await db.labTest.findMany({
      where: {
        name: testName,
        lab: {
          userId: session.user.id,
        },
      },
      include: {
        lab: {
          select: {
            sampledAt: true,
            resultAt: true,
            provider: true,
          },
        },
      },
      orderBy: {
        lab: {
          sampledAt: "asc",
        },
      },
    });

    // Transform to time-series format
    const timeSeries = tests.map((test) => ({
      date:
        test.lab.sampledAt?.toISOString() ??
        test.lab.resultAt?.toISOString() ??
        test.createdAt.toISOString(),
      value: test.value,
      rawValue: test.rawValue,
      unit: test.unit,
      referenceRange: test.refRaw,
      provider: test.lab.provider,
    }));

    // Deduplicate identical points (e.g., when the same PDF was imported twice)
    const seen = new Set<string>();
    const deduped = timeSeries.filter((point) => {
      const key = [
        point.date,
        point.rawValue,
        point.unit ?? "",
        point.referenceRange ?? "",
        point.provider ?? "",
      ].join("|");

      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    return NextResponse.json({
      ok: true,
      testName,
      data: deduped,
      count: deduped.length,
    });
  } catch (err) {
    console.error("[labs-history] Failed to fetch test history", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch test history" },
      { status: 500 }
    );
  }
}
