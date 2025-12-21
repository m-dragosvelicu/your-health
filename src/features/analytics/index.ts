// Public API for the analytics feature

// Server-side
export { analyticsRouter } from "./api/router";
export { trackEvent, trackPageView, trackFeatureUsage } from "./lib/tracking";
export { getAnalyticsSummary, getDailyStats } from "./lib/queries";
export type { AnalyticsEvent, TrackEventInput } from "./lib/types";

// Client-side
export { AnalyticsProvider, useAnalytics } from "./components/analytics-provider";
