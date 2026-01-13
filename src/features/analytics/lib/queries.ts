/**
 * Analytics Query Functions
 *
 * These functions retrieve and aggregate analytics data for the dashboard.
 * All queries return aggregated, anonymized data - never individual user data.
 */

import { db } from "@/shared/server/db";
import {
  startOfDay,
  endOfDay,
  subDays,
  differenceInDays,
} from "date-fns";
import type {
  AnalyticsSummary,
  DailyStat,
  FeatureUsageStat,
} from "./types";

/**
 * Get overall analytics summary for a date range
 */
export async function getAnalyticsSummary(
  startDate: Date,
  endDate: Date
): Promise<AnalyticsSummary> {
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);

  // Calculate previous period for trend comparison
  const periodLength = differenceInDays(end, start) + 1;
  const previousStart = subDays(start, periodLength);
  const previousEnd = subDays(start, 1);

  // Get current period stats
  const [currentStats, previousStats, featureStats] = await Promise.all([
    getPeriodStats(start, end),
    getPeriodStats(previousStart, previousEnd),
    getFeatureStats(start, end),
  ]);

  // Calculate trends (percentage change)
  const pageViewsChange = calculatePercentageChange(
    previousStats.totalPageViews,
    currentStats.totalPageViews
  );
  const usersChange = calculatePercentageChange(
    previousStats.uniqueUsers,
    currentStats.uniqueUsers
  );

  return {
    period: { start, end },
    overview: {
      totalPageViews: currentStats.totalPageViews,
      uniqueSessions: currentStats.uniqueSessions,
      uniqueUsers: currentStats.uniqueUsers,
      avgSessionDuration: currentStats.avgSessionDuration,
    },
    features: featureStats,
    trends: {
      pageViewsChange,
      usersChange,
    },
  };
}

/**
 * Get daily statistics for charting
 */
export async function getDailyStats(
  startDate: Date,
  endDate: Date
): Promise<DailyStat[]> {
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);

  // Get pre-aggregated daily stats
  const dailyStats = await db.analyticsDailyStat.findMany({
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { date: "asc" },
  });

  return dailyStats.map((stat) => ({
    date: stat.date,
    pageViews: stat.pageViews,
    uniqueSessions: stat.uniqueSessions,
    uniqueUsers: stat.uniqueUsers,
    labsUploaded: stat.labsUploaded,
    medicationsCreated: stat.medicationsCreated,
    medicationsLogged: stat.medicationsLogged,
  }));
}

/**
 * Get feature usage breakdown
 */
export async function getFeatureUsageBreakdown(
  startDate: Date,
  endDate: Date
): Promise<FeatureUsageStat[]> {
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);

  const featureUsage = await db.analyticsFeatureUsage.groupBy({
    by: ["feature", "action"],
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
    _sum: {
      count: true,
    },
    orderBy: {
      _sum: {
        count: "desc",
      },
    },
  });

  return featureUsage.map((item) => ({
    feature: item.feature,
    action: item.action,
    count: item._sum.count ?? 0,
  }));
}

/**
 * Get real-time active users (sessions in last 5 minutes)
 */
export async function getActiveUsers(): Promise<number> {
  const fiveMinutesAgo = subDays(new Date(), 0); // 5 minutes
  fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

  const result = await db.analyticsEvent.groupBy({
    by: ["sessionId"],
    where: {
      createdAt: {
        gte: fiveMinutesAgo,
      },
    },
  });

  return result.length;
}

/**
 * Get top pages by views
 */
export async function getTopPages(
  startDate: Date,
  endDate: Date,
  limit = 10
): Promise<Array<{ path: string; views: number }>> {
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);

  const topPages = await db.analyticsEvent.groupBy({
    by: ["path"],
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
      category: "page_view",
      path: { not: null },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
    take: limit,
  });

  return topPages.map((page) => ({
    path: page.path ?? "unknown",
    views: page._count.id,
  }));
}

/**
 * Get device type distribution
 */
export async function getDeviceDistribution(
  startDate: Date,
  endDate: Date
): Promise<Array<{ deviceType: string; count: number; percentage: number }>> {
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);

  const devices = await db.analyticsEvent.groupBy({
    by: ["deviceType"],
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
      deviceType: { not: null },
    },
    _count: {
      id: true,
    },
  });

  const total = devices.reduce((sum, d) => sum + d._count.id, 0);

  return devices.map((d) => ({
    deviceType: d.deviceType ?? "unknown",
    count: d._count.id,
    percentage: total > 0 ? Math.round((d._count.id / total) * 100) : 0,
  }));
}

// ============================================================================
// Helper Functions
// ============================================================================

interface PeriodStats {
  totalPageViews: number;
  uniqueSessions: number;
  uniqueUsers: number;
  avgSessionDuration: number | null;
}

async function getPeriodStats(start: Date, end: Date): Promise<PeriodStats> {
  const [pageViews, sessions, users, avgDuration] = await Promise.all([
    // Total page views
    db.analyticsEvent.count({
      where: {
        createdAt: { gte: start, lte: end },
        category: "page_view",
      },
    }),
    // Unique sessions
    db.analyticsEvent
      .groupBy({
        by: ["sessionId"],
        where: { createdAt: { gte: start, lte: end } },
      })
      .then((result) => result.length),
    // Unique users (only those with userId)
    db.analyticsEvent
      .groupBy({
        by: ["userId"],
        where: {
          createdAt: { gte: start, lte: end },
          userId: { not: null },
        },
      })
      .then((result) => result.length),
    // Average session duration from daily stats
    db.analyticsDailyStat.aggregate({
      where: { date: { gte: start, lte: end } },
      _avg: { avgSessionDuration: true },
    }),
  ]);

  return {
    totalPageViews: pageViews,
    uniqueSessions: sessions,
    uniqueUsers: users,
    avgSessionDuration: avgDuration._avg.avgSessionDuration,
  };
}

interface FeatureStats {
  labsUploaded: number;
  medicationsCreated: number;
  medicationsLogged: number;
}

async function getFeatureStats(start: Date, end: Date): Promise<FeatureStats> {
  const stats = await db.analyticsDailyStat.aggregate({
    where: { date: { gte: start, lte: end } },
    _sum: {
      labsUploaded: true,
      medicationsCreated: true,
      medicationsLogged: true,
    },
  });

  return {
    labsUploaded: stats._sum.labsUploaded ?? 0,
    medicationsCreated: stats._sum.medicationsCreated ?? 0,
    medicationsLogged: stats._sum.medicationsLogged ?? 0,
  };
}

function calculatePercentageChange(previous: number, current: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
}
