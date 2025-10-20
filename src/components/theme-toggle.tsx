"use client";

import { useEffect, useMemo, useState } from "react";
import { Moon, Sun } from "lucide-react";
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

  // Compute whether dark is currently active (for icon)
  const isDark = useMemo(() => {
    if (mode === null) return false;
    return mode === "dark" || (mode === "system" && getSystemPrefersDark());
  }, [mode]);

  // Initialize from storage or system on mount
  useEffect(() => {
    try {
      const stored = (localStorage.getItem(STORAGE_KEY) as Mode | null) ?? "system";
      setMode(stored);
      applyTheme(stored);
    } catch (_err) {
      setMode("system");
      applyTheme("system");
    }

    // If user selected system, update when system preference changes
    const mql = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      setMode((prev) => {
        if (prev === "system") applyTheme("system");
        return prev;
      });
    };
    try {
      mql?.addEventListener?.("change", handler);
    } catch {
      // Safari support
      // @ts-ignore
      mql?.addListener?.(handler);
    }
    return () => {
      try {
        mql?.removeEventListener?.("change", handler);
      } catch {
        // @ts-ignore
        mql?.removeListener?.(handler);
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

  const label = mode === "system" ? "System" : mode === "dark" ? "Dark" : "Light";

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
        {/* Sun and moon icons crossfade/rotate */}
        <Sun className={`size-5 transition-all ${isDark ? "scale-0 rotate-90" : "scale-100 rotate-0"}`} />
        <Moon className={`absolute size-5 transition-all ${isDark ? "scale-100 rotate-0" : "scale-0 -rotate-90"}`} />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
}
