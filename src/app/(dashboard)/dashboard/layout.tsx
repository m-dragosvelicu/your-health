import { type Metadata } from "next";
import Link from "next/link";
import { type ReactNode } from "react";
import { SettingsDropdown } from "@/app/_components/settings-dropdown";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View your health overview, recent lab results, and medication schedule.",
};

// Dashboard shell applied to all /dashboard pages - using deep purple brand theme (light mode only)
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="brand-light min-h-svh bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="text-lg font-semibold">YourHealth</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard/labs" className="hover:text-foreground transition-colors">
              Labs
            </Link>
            <Link href="/dashboard/medications" className="hover:text-foreground transition-colors">
              Medications
            </Link>
            <SettingsDropdown />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
