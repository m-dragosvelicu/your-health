"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, SunMoon } from "lucide-react";
import { Button } from "~/components/ui/button";

// Storage key to persist user preference
const STORAGE_KEY = "theme"; // values: "light" | "dark" | "system"

type Mode = "light" | "dark" | "system";

function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(mode: Mode) {
  const isDark = mode === "dark" || (mode === "system" && getSystemPrefersDark());
  const root = document.documentElement;
  root.classList.toggle("dark", isDark);
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode | null>(null);


  // Initialize from storage or system on mount
  useEffect(() => {
    try {
      const stored = (localStorage.getItem(STORAGE_KEY) as Mode | null) ?? "system";
      setMode(stored);
      applyTheme(stored);
    } catch {
      setMode("system");
      applyTheme("system");
    }

    // No-op if matchMedia not available (very old browsers)
    if (typeof window.matchMedia !== "function") return;

    // If user selected system, update when system preference changes
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      setMode((prev) => {
        if (prev === "system") applyTheme("system");
        return prev;
      });
    };

    // Prefer modern API; fall back for legacy Safari
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
    } else {
      const legacy = mql as MediaQueryList & {
        addListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void;
        removeListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void;
      };
      legacy.addListener?.(handler);
    }

    return () => {
      if (typeof mql.removeEventListener === "function") {
        mql.removeEventListener("change", handler);
      } else {
        const legacy = mql as MediaQueryList & {
          addListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void;
          removeListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void;
        };
        legacy.removeListener?.(handler);
      }
    };
  }, []);

  const cycleMode = () => {
    // Cycle: system -> light -> dark -> system
    const next: Mode = mode === "system" ? "light" : mode === "light" ? "dark" : "system";
    setMode(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    applyTheme(next);
  };

  if (mode === null) return null; // avoid SSR mismatch flash

  const label = mode === "system" ? "Auto" : mode === "dark" ? "Dark" : "Light";

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        type="button"
        size="icon"
        variant="outline"
        aria-label={`Toggle theme (current: ${label})`}
        title={`Theme: ${label} (click to change)`}
        onClick={cycleMode}
        className="relative transition-colors"
      >
        {/* Sun, Moon, and Auto (SunMoon) icons crossfade/rotate based on explicit mode */}
        <Sun
          className={`size-5 transition-all ${mode === "light" ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-0 -rotate-90"}`}
        />
        <Moon
          className={`absolute size-5 transition-all ${mode === "dark" ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-0 -rotate-90"}`}
        />
        <SunMoon
          className={`absolute size-5 transition-all ${mode === "system" ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-0 -rotate-90"}`}
        />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
}
