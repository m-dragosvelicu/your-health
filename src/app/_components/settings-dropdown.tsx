"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/shared/components/ui/button";

export function SettingsDropdown() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await signOut({ callbackUrl: "/auth?mode=login" });
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>Settings</span>
        <svg
          aria-hidden="true"
          className="size-3.5"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-md border bg-popover text-sm shadow-md">
          <button
            type="button"
            className="flex w-full items-center justify-between px-3 py-2 text-left text-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={handleLogout}
          >
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}

