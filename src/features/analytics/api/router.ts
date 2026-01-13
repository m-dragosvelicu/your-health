/**
 * Analytics tRPC Router
 *
 * Provides endpoints for:
 * - Tracking events from the client
 * - Fetching analytics data for the dashboard
 *
 * Note: Dashboard queries require authentication (protected procedures)
 * Event tracking uses public procedures but doesn't expose user data
 */

import { z } from "zod";
import { subDays, startOfDay } from "date-fns";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/shared/server/api/trpc";
import {
  trackEvent,
  trackEventBatch,
  trackPageView,
  trackFeatureUsage,
} from "../lib/tracking";
import {
  getAnalyticsSummary,
  getDailyStats,
  getFeatureUsageBreakdown,
  getActiveUsers,
  getTopPages,
  getDeviceDistribution,
} from "../lib/queries";
import { trackEventSchema, trackEventBatchSchema } from "../lib/types";

export const analyticsRouter = createTRPCRouter({
  // ============================================================================
  // Event Tracking (Public - for client-side tracking)
  // ============================================================================

  /**
   * Track a single event
   * Public because it's called from the client before/after auth
   */
  track: publicProcedure
    .input(trackEventSchema)
    .mutation(async ({ input, ctx }) => {
      // If user is logged in, attach their ID for aggregate stats
      const userId = ctx.session?.user?.id;
      await trackEvent({ ...input, userId: userId ?? input.userId });
      return { success: true };
    }),

  /**
   * Track multiple events in a batch (for performance)
   */
  trackBatch: publicProcedure
    .input(trackEventBatchSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session?.user?.id;
      const eventsWithUser = input.events.map((event) => ({
        ...event,
        userId: userId ?? event.userId,
      }));
      await trackEventBatch({ events: eventsWithUser });
      return { success: true, count: input.events.length };
    }),

  /**
   * Track a page view (convenience endpoint)
   */
  pageView: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        path: z.string(),
        deviceType: z.enum(["desktop", "mobile", "tablet"]).optional(),
        referrerDomain: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await trackPageView(input.sessionId, input.path, {
        userId: ctx.session?.user?.id,
        deviceType: input.deviceType,
        referrerDomain: input.referrerDomain,
      });
      return { success: true };
    }),

  /**
   * Track feature usage (convenience endpoint)
   */
  feature: publicProcedure
    .input(
      z.object({
        sessionId: z.string(),
        feature: z.string(),
        action: z.string(),
        value: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await trackFeatureUsage(input.sessionId, input.feature, input.action, {
        userId: ctx.session?.user?.id,
        value: input.value,
      });
      return { success: true };
    }),

  // ============================================================================
  // Dashboard Queries (Protected - requires authentication)
  // ============================================================================

  /**
   * Get analytics summary for a date range
   */
  getSummary: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      const endDate = input.endDate ?? new Date();
      const startDate = input.startDate ?? subDays(endDate, 30);
      return getAnalyticsSummary(startDate, endDate);
    }),

  /**
   * Get daily statistics for charting
   */
  getDailyStats: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const endDate = new Date();
      const startDate = subDays(startOfDay(endDate), input.days - 1);
      return getDailyStats(startDate, endDate);
    }),

  /**
   * Get feature usage breakdown
   */
  getFeatureUsage: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const endDate = new Date();
      const startDate = subDays(startOfDay(endDate), input.days - 1);
      return getFeatureUsageBreakdown(startDate, endDate);
    }),

  /**
   * Get currently active users (real-time)
   */
  getActiveUsers: protectedProcedure.query(async () => {
    return { count: await getActiveUsers() };
  }),

  /**
   * Get top pages by views
   */
  getTopPages: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      const endDate = new Date();
      const startDate = subDays(startOfDay(endDate), input.days - 1);
      return getTopPages(startDate, endDate, input.limit);
    }),

  /**
   * Get device type distribution
   */
  getDeviceDistribution: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const endDate = new Date();
      const startDate = subDays(startOfDay(endDate), input.days - 1);
      return getDeviceDistribution(startDate, endDate);
    }),
});
