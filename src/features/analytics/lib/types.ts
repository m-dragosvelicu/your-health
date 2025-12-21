import { z } from "zod";

// Event categories for classification
export const EventCategory = {
  PAGE_VIEW: "page_view",
  FEATURE: "feature",
  ENGAGEMENT: "engagement",
  ERROR: "error",
} as const;

export type EventCategoryType = (typeof EventCategory)[keyof typeof EventCategory];

// Common actions
export const EventAction = {
  VIEW: "view",
  CLICK: "click",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  UPLOAD: "upload",
  DOWNLOAD: "download",
  LOGIN: "login",
  LOGOUT: "logout",
  REGISTER: "register",
} as const;

export type EventActionType = (typeof EventAction)[keyof typeof EventAction];

// Feature labels (what features are being used)
export const FeatureLabel = {
  DASHBOARD: "dashboard",
  LABS: "labs",
  MEDICATIONS: "medications",
  AUTH: "auth",
  SETTINGS: "settings",
  PROFILE: "profile",
} as const;

export type FeatureLabelType = (typeof FeatureLabel)[keyof typeof FeatureLabel];

// Device types (broad categories only - no fingerprinting)
export const DeviceType = {
  DESKTOP: "desktop",
  MOBILE: "mobile",
  TABLET: "tablet",
} as const;

export type DeviceTypeType = (typeof DeviceType)[keyof typeof DeviceType];

// Zod schema for event input validation
export const trackEventSchema = z.object({
  sessionId: z.string().min(1),
  userId: z.string().optional(),
  category: z.string().min(1),
  action: z.string().min(1),
  label: z.string().optional(),
  value: z.number().optional(),
  path: z.string().optional(),
  deviceType: z.enum(["desktop", "mobile", "tablet"]).optional(),
  referrerDomain: z.string().optional(),
});

export type TrackEventInput = z.infer<typeof trackEventSchema>;

// Batch tracking for performance
export const trackEventBatchSchema = z.object({
  events: z.array(trackEventSchema).min(1).max(50),
});

export type TrackEventBatchInput = z.infer<typeof trackEventBatchSchema>;

// Analytics event as stored in DB
export interface AnalyticsEvent {
  id: string;
  createdAt: Date;
  sessionId: string;
  userId: string | null;
  category: string;
  action: string;
  label: string | null;
  value: number | null;
  path: string | null;
  deviceType: string | null;
  referrerDomain: string | null;
}

// Summary statistics for dashboard
export interface AnalyticsSummary {
  period: {
    start: Date;
    end: Date;
  };
  overview: {
    totalPageViews: number;
    uniqueSessions: number;
    uniqueUsers: number;
    avgSessionDuration: number | null;
  };
  features: {
    labsUploaded: number;
    medicationsCreated: number;
    medicationsLogged: number;
  };
  trends: {
    pageViewsChange: number; // percentage change from previous period
    usersChange: number;
  };
}

// Daily stats for charts
export interface DailyStat {
  date: Date;
  pageViews: number;
  uniqueSessions: number;
  uniqueUsers: number;
  labsUploaded: number;
  medicationsCreated: number;
  medicationsLogged: number;
}

// Feature usage breakdown
export interface FeatureUsageStat {
  feature: string;
  action: string;
  count: number;
}
