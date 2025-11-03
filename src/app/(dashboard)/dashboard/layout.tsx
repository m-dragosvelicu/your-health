import { type ReactNode } from "react";

// Dashboard shell applied to all /dashboard pages
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
          <div className="font-semibold">Dashboard</div>
          <nav className="flex items-center gap-3 text-sm text-muted-foreground">
            {/* Add real nav links as features land */}
            <a href="/" className="hover:text-foreground">Home</a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

