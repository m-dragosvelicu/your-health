import { NextResponse } from "next/server";
import { auth } from "@/shared/server/auth";
import { db } from "@/shared/server/db";

export const runtime = "nodejs";

/**
 * GET /api/labs/history?testName=TSH&days=90
 *
 * Returns time-series data for a specific lab test across all lab sessions.
 * Optional `days` param filters to results within that many days (e.g., 90, 180, 365).
 * Use days=0 or omit for all data.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const testName = searchParams.get("testName");
  const daysParam = searchParams.get("days");
  const days = daysParam ? parseInt(daysParam, 10) : 0;

  if (!testName) {
    return NextResponse.json(
      { ok: false, error: "Missing testName parameter" },
      { status: 400 }
    );
  }

  // Calculate cutoff date if days filter is specified
  let dateFilter: { gte: Date } | undefined = undefined;
  if (days > 0) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    dateFilter = { gte: cutoffDate };
  }

  try {
    // Get all tests with this name for the current user, ordered by date
    const tests = await db.labTest.findMany({
      where: {
        name: testName,
        lab: {
          userId: session.user.id,
          ...(dateFilter && { sampledAt: dateFilter }),
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

    // Add change indicators comparing to previous value
    const withChanges = deduped.map((point, index) => {
      const previousValue = index > 0 ? deduped[index - 1]?.value ?? null : null;
      let changePercent: number | null = null;
      let changeDirection: "up" | "down" | "same" | null = null;

      if (point.value !== null && previousValue !== null && previousValue !== 0) {
        changePercent = ((point.value - previousValue) / Math.abs(previousValue)) * 100;
        if (Math.abs(changePercent) < 0.5) {
          changeDirection = "same";
        } else if (changePercent > 0) {
          changeDirection = "up";
        } else {
          changeDirection = "down";
        }
      }

      return {
        ...point,
        previousValue,
        changePercent: changePercent !== null ? Math.round(changePercent * 10) / 10 : null,
        changeDirection,
      };
    });

    return NextResponse.json({
      ok: true,
      testName,
      data: withChanges,
      count: withChanges.length,
    });
  } catch (err) {
    console.error("[labs-history] Failed to fetch test history", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch test history" },
      { status: 500 }
    );
  }
}
