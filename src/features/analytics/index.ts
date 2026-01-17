// Public API for the analytics feature
// NOTE: Server and client exports are separated to prevent bundling issues

// Client-side exports (safe to import in "use client" components)
export { AnalyticsProvider, useAnalytics } from "./components/analytics-provider";

// Server-side exports - import these DIRECTLY in server code only:
// import { analyticsRouter } from "@/features/analytics/api/router";
// import { trackEvent, trackPageView, trackFeatureUsage } from "@/features/analytics/lib/tracking";
// import { getAnalyticsSummary, getDailyStats } from "@/features/analytics/lib/queries";

// Types are safe to export (no runtime code)
export type { AnalyticsEvent, TrackEventInput } from "./lib/types";
