import Link from "next/link";
import LabValuesChart from "@/app/_components/lab-values-chart";

export default function DashboardPage() {
  return (
    <section className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Your health tracking dashboard
          </p>
        </div>
      </div>

      {/* Lab Values Chart */}
      <LabValuesChart />

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Labs */}
        <Link
          href="/dashboard/labs"
          className="rounded-lg border bg-card p-6 shadow-sm transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Lab Results</p>
              <p className="text-sm text-muted-foreground">View imported labs & trends</p>
            </div>
          </div>
        </Link>

        {/* Import Labs */}
        <Link
          href="/dashboard/labs/import"
          className="rounded-lg border bg-card p-6 shadow-sm transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Import Labs</p>
              <p className="text-sm text-muted-foreground">Upload PDF or image</p>
            </div>
          </div>
        </Link>

        {/* Medications */}
        <Link
          href="/dashboard/medications"
          className="rounded-lg border bg-card p-6 shadow-sm transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Medications</p>
              <p className="text-sm text-muted-foreground">Track doses & adherence</p>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
