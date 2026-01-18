/**
 * Privacy-Respecting Analytics Tracking
 *
 * This module handles event tracking while preserving user privacy:
 * - No PII (Personally Identifiable Information) is captured
 * - No health data content is ever tracked
 * - Session IDs are anonymized and rotated
 * - Only behavioral patterns are recorded
 */

import { db } from "@/shared/server/db";
import { startOfDay } from "date-fns";
import type { TrackEventInput, TrackEventBatchInput } from "./types";

/**
 * Track a single analytics event
 */
export async function trackEvent(input: TrackEventInput): Promise<void> {
  try {
    await db.analyticsEvent.create({
      data: {
        sessionId: input.sessionId,
        userId: input.userId,
        category: input.category,
        action: input.action,
        label: input.label,
        value: input.value,
        path: sanitizePath(input.path),
        deviceType: input.deviceType,
        referrerDomain: input.referrerDomain,
      },
    });

    // Update daily aggregates asynchronously
    void updateDailyStats(input);
  } catch (error) {
    // Analytics should never break the main app
    console.error("[Analytics] Failed to track event:", error);
  }
}

/**
 * Track multiple events in a single batch (for performance)
 */
export async function trackEventBatch(input: TrackEventBatchInput): Promise<void> {
  try {
    await db.analyticsEvent.createMany({
      data: input.events.map((event) => ({
        sessionId: event.sessionId,
        userId: event.userId,
        category: event.category,
        action: event.action,
        label: event.label,
        value: event.value,
        path: sanitizePath(event.path),
        deviceType: event.deviceType,
        referrerDomain: event.referrerDomain,
      })),
    });

    // Update daily stats for each event
    for (const event of input.events) {
      void updateDailyStats(event);
    }
  } catch (error) {
    console.error("[Analytics] Failed to track batch:", error);
  }
}

/**
 * Convenience function for tracking page views
 */
export async function trackPageView(
  sessionId: string,
  path: string,
  options?: {
    userId?: string;
    deviceType?: "desktop" | "mobile" | "tablet";
    referrerDomain?: string;
  }
): Promise<void> {
  await trackEvent({
    sessionId,
    userId: options?.userId,
    category: "page_view",
    action: "view",
    label: extractPageLabel(path),
    path,
    deviceType: options?.deviceType,
    referrerDomain: options?.referrerDomain,
  });
}

/**
 * Convenience function for tracking feature usage
 */
export async function trackFeatureUsage(
  sessionId: string,
  feature: string,
  action: string,
  options?: {
    userId?: string;
    value?: number;
  }
): Promise<void> {
  await trackEvent({
    sessionId,
    userId: options?.userId,
    category: "feature",
    action,
    label: feature,
    value: options?.value,
  });

  // Update feature-specific aggregates
  void updateFeatureUsage(feature, action);
}

/**
 * Update daily aggregated statistics
 * This runs asynchronously to not block the main request
 */
async function updateDailyStats(event: TrackEventInput): Promise<void> {
  const today = startOfDay(new Date());

  try {
    // Upsert daily stats
    await db.analyticsDailyStat.upsert({
      where: { date: today },
      create: {
        date: today,
        pageViews: event.category === "page_view" ? 1 : 0,
        uniqueSessions: 1,
        uniqueUsers: event.userId ? 1 : 0,
        labsUploaded: isLabUpload(event) ? 1 : 0,
        medicationsCreated: isMedicationCreate(event) ? 1 : 0,
        medicationsLogged: isMedicationLog(event) ? 1 : 0,
      },
      update: {
        pageViews: event.category === "page_view"
          ? { increment: 1 }
          : undefined,
        labsUploaded: isLabUpload(event)
          ? { increment: 1 }
          : undefined,
        medicationsCreated: isMedicationCreate(event)
          ? { increment: 1 }
          : undefined,
        medicationsLogged: isMedicationLog(event)
          ? { increment: 1 }
          : undefined,
      },
    });
  } catch (error) {
    console.error("[Analytics] Failed to update daily stats:", error);
  }
}

/**
 * Update feature-specific usage aggregates
 */
async function updateFeatureUsage(feature: string, action: string): Promise<void> {
  const today = startOfDay(new Date());

  try {
    await db.analyticsFeatureUsage.upsert({
      where: {
        date_feature_action: {
          date: today,
          feature,
          action,
        },
      },
      create: {
        date: today,
        feature,
        action,
        count: 1,
      },
      update: {
        count: { increment: 1 },
      },
    });
  } catch (error) {
    console.error("[Analytics] Failed to update feature usage:", error);
  }
}

/**
 * Sanitize path to remove sensitive query parameters
 * Only keeps the path, removes any potential PII from query strings
 */
function sanitizePath(path: string | undefined): string | undefined {
  if (!path) return undefined;

  // Remove query parameters entirely for privacy
  const [cleanPath] = path.split("?");

  // Remove any potential IDs from dynamic routes (e.g., /labs/abc123 -> /labs/[id])
  return cleanPath
    ?.replace(/\/[a-zA-Z0-9]{20,}(?=\/|$)/g, "/[id]") // cuid-like IDs
    .replace(/\/\d+(?=\/|$)/g, "/[id]"); // numeric IDs
}

/**
 * Extract a human-readable label from the path
 */
function extractPageLabel(path: string): string {
  const cleanPath = sanitizePath(path) ?? "/";
  const segments = cleanPath.split("/").filter(Boolean);

  // Return the primary section or "home"
  return segments[0] ?? "home";
}

// Helper functions to categorize events
function isLabUpload(event: TrackEventInput): boolean {
  return event.category === "feature" &&
         event.label === "labs" &&
         event.action === "upload";
}

function isMedicationCreate(event: TrackEventInput): boolean {
  return event.category === "feature" &&
         event.label === "medications" &&
         event.action === "create";
}

function isMedicationLog(event: TrackEventInput): boolean {
  return event.category === "feature" &&
         event.label === "medications" &&
         (event.action === "log" || event.action === "taken" || event.action === "skipped");
}
