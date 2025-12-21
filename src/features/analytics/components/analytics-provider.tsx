"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { api } from "~/trpc/trpc-provider";

// ============================================================================
// Types
// ============================================================================

interface AnalyticsContextValue {
  /** Track a custom event */
  trackEvent: (
    category: string,
    action: string,
    label?: string,
    value?: number
  ) => void;
  /** Track feature usage */
  trackFeature: (feature: string, action: string, value?: number) => void;
  /** Get the current session ID (for debugging) */
  sessionId: string;
}

// ============================================================================
// Session ID Management (Privacy-Respecting)
// ============================================================================

/**
 * Generate a random session ID that can't be linked to user identity
 * Rotates every 30 minutes for added privacy
 */
function generateSessionId(): string {
  const timestamp = Math.floor(Date.now() / (30 * 60 * 1000)); // 30-minute buckets
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

/**
 * Get or create a session ID from sessionStorage
 * Using sessionStorage means it's cleared when the browser closes
 */
function getOrCreateSessionId(): string {
  if (typeof window === "undefined") {
    return "server-render";
  }

  const STORAGE_KEY = "analytics_session_id";
  const TIMESTAMP_KEY = "analytics_session_ts";
  const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

  const stored = sessionStorage.getItem(STORAGE_KEY);
  const timestamp = sessionStorage.getItem(TIMESTAMP_KEY);
  const now = Date.now();

  // Check if session is still valid (within 30 minutes)
  if (stored && timestamp && now - parseInt(timestamp, 10) < SESSION_DURATION) {
    // Update timestamp to extend session
    sessionStorage.setItem(TIMESTAMP_KEY, now.toString());
    return stored;
  }

  // Create new session
  const newSessionId = generateSessionId();
  sessionStorage.setItem(STORAGE_KEY, newSessionId);
  sessionStorage.setItem(TIMESTAMP_KEY, now.toString());
  return newSessionId;
}

// ============================================================================
// Device Detection (Broad Categories Only - No Fingerprinting)
// ============================================================================

function getDeviceType(): "desktop" | "mobile" | "tablet" {
  if (typeof window === "undefined") return "desktop";

  const ua = navigator.userAgent.toLowerCase();

  // Very basic detection - just categories, no fingerprinting
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return "tablet";
  }
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

/**
 * Extract just the domain from the referrer (not the full URL)
 */
function getReferrerDomain(): string | undefined {
  if (typeof document === "undefined" || !document.referrer) {
    return undefined;
  }

  try {
    const url = new URL(document.referrer);
    // Only return external referrers
    if (url.hostname !== window.location.hostname) {
      return url.hostname;
    }
  } catch {
    // Invalid URL
  }
  return undefined;
}

// ============================================================================
// Context & Provider
// ============================================================================

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
  /** Disable tracking (e.g., for development or opt-out) */
  disabled?: boolean;
}

export function AnalyticsProvider({
  children,
  disabled = false,
}: AnalyticsProviderProps) {
  const pathname = usePathname();
  const sessionIdRef = useRef<string>("");
  const lastPathRef = useRef<string>("");

  // tRPC mutations
  const pageViewMutation = api.analytics.pageView.useMutation();
  const featureMutation = api.analytics.feature.useMutation();
  const trackMutation = api.analytics.track.useMutation();

  // Initialize session ID on client
  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (disabled || !pathname || pathname === lastPathRef.current) {
      return;
    }

    lastPathRef.current = pathname;

    // Delay slightly to ensure session ID is ready
    const timer = setTimeout(() => {
      if (sessionIdRef.current && sessionIdRef.current !== "server-render") {
        pageViewMutation.mutate({
          sessionId: sessionIdRef.current,
          path: pathname,
          deviceType: getDeviceType(),
          referrerDomain: getReferrerDomain(),
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, disabled, pageViewMutation]);

  // Track custom events
  const trackEvent = useCallback(
    (category: string, action: string, label?: string, value?: number) => {
      if (disabled || !sessionIdRef.current || sessionIdRef.current === "server-render") {
        return;
      }

      trackMutation.mutate({
        sessionId: sessionIdRef.current,
        category,
        action,
        label,
        value,
        path: pathname ?? undefined,
        deviceType: getDeviceType(),
      });
    },
    [disabled, trackMutation, pathname]
  );

  // Track feature usage
  const trackFeature = useCallback(
    (feature: string, action: string, value?: number) => {
      if (disabled || !sessionIdRef.current || sessionIdRef.current === "server-render") {
        return;
      }

      featureMutation.mutate({
        sessionId: sessionIdRef.current,
        feature,
        action,
        value,
      });
    },
    [disabled, featureMutation]
  );

  const value: AnalyticsContextValue = {
    trackEvent,
    trackFeature,
    sessionId: sessionIdRef.current,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access analytics tracking functions
 *
 * @example
 * const { trackFeature } = useAnalytics();
 * trackFeature("labs", "upload");
 */
export function useAnalytics(): AnalyticsContextValue {
  const context = useContext(AnalyticsContext);

  if (!context) {
    // Return no-op functions if used outside provider
    return {
      trackEvent: () => {},
      trackFeature: () => {},
      sessionId: "",
    };
  }

  return context;
}
