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

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">Recent Labs</div>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="mt-2 text-2xl font-bold">3</div>
          <p className="text-xs text-muted-foreground">Last imported 2 days ago</p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">Medications</div>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="mt-2 text-2xl font-bold">5</div>
          <p className="text-xs text-muted-foreground">92% adherence this week</p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">Active Shares</div>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <div className="mt-2 text-2xl font-bold">1</div>
          <p className="text-xs text-muted-foreground">Expires in 22h</p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">Data Points</div>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="mt-2 text-2xl font-bold">142</div>
          <p className="text-xs text-muted-foreground">Across all panels</p>
        </div>
      </div>

      {/* Main Features Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* US-1: Scan & Import Labs */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b p-6">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h2 className="text-lg font-semibold">Scan & Import Labs</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Snap a photo of your lab report and extract values instantly
            </p>
          </div>
          <div className="p-6">
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 p-8">
              <svg className="mb-3 h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mb-1 text-sm font-medium">Import lab report</p>
              <p className="mb-4 text-xs text-muted-foreground">PDF or image (up to 3 pages)</p>
              <Link
                href="/dashboard/labs/import"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Import labs
              </Link>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>OCR confidence tracking</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Edit values before saving</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Original file stored with provenance</span>
              </div>
            </div>
          </div>
        </div>

        {/* US-2: Timeline & Trend Charts */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b p-6">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h2 className="text-lg font-semibold">Timeline & Trends</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Track lab values over time with reference ranges
            </p>
          </div>
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium">Recent Panels</span>
              <select className="rounded-md border bg-background px-3 py-1 text-sm">
                <option>Last result</option>
                <option>Last 3 months</option>
                <option>Last 6 months</option>
                <option>Last 12 months</option>
              </select>
            </div>
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Glucose</span>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-green-600">↓</span>
                    <span className="font-semibold">95 mg/dL</span>
                  </div>
                </div>
                <div className="mb-1 h-2 w-full rounded-full bg-background">
                  <div className="h-2 rounded-full bg-green-600" style={{ width: "45%" }}></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>70</span>
                  <span className="font-medium text-foreground">Range: 70-100 mg/dL</span>
                  <span>100</span>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Cholesterol (Total)</span>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-red-600">↑</span>
                    <span className="font-semibold">215 mg/dL</span>
                  </div>
                </div>
                <div className="mb-1 h-2 w-full rounded-full bg-background">
                  <div className="h-2 rounded-full bg-yellow-600" style={{ width: "72%" }}></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span className="font-medium text-foreground">Range: &lt;200 mg/dL</span>
                  <span>300</span>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Hemoglobin A1c</span>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground">=</span>
                    <span className="font-semibold">5.4%</span>
                  </div>
                </div>
                <div className="mb-1 h-2 w-full rounded-full bg-background">
                  <div className="h-2 rounded-full bg-green-600" style={{ width: "54%" }}></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span className="font-medium text-foreground">Range: &lt;5.7%</span>
                  <span>10</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* US-3: Med Logging */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b p-6">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h2 className="text-lg font-semibold">Medication Tracking</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Quick logging with forgiving reminders
            </p>
          </div>
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium">Today's Schedule</span>
              <span className="text-xs text-muted-foreground">92% adherence</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border bg-green-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Metformin 500mg</p>
                    <p className="text-xs text-muted-foreground">8:00 AM - Taken at 8:05 AM</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border bg-background p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/50 text-muted-foreground">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Vitamin D 2000 IU</p>
                    <p className="text-xs text-muted-foreground">2:00 PM - Due now</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                    Take
                  </button>
                  <button className="rounded-md border bg-background px-3 py-1 text-xs font-medium hover:bg-muted">
                    Snooze
                  </button>
                  <button className="rounded-md border bg-background px-3 py-1 text-xs font-medium hover:bg-muted">
                    Skip
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-muted-foreground/50 text-muted-foreground">
                    <span className="text-xs font-semibold">8PM</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Metformin 500mg</p>
                    <p className="text-xs text-muted-foreground">8:00 PM - Scheduled</p>
                  </div>
                </div>
              </div>
            </div>
            <button className="mt-4 w-full rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">
              + Add Medication
            </button>
          </div>
        </div>

        {/* US-4: Share Links */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b p-6">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <h2 className="text-lg font-semibold">Secure Sharing</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Time-limited, scoped access for clinicians
            </p>
          </div>
          <div className="p-6">
            <div className="mb-4 rounded-lg border bg-muted/20 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">Active Share</span>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Scope:</span>
                  <span className="font-medium text-foreground">Labs + Medications</span>
                </div>
                <div className="flex justify-between">
                  <span>Expires:</span>
                  <span className="font-medium text-foreground">Nov 4, 2025 @ 12:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Last viewed:</span>
                  <span className="font-medium text-foreground">Nov 3, 2025 @ 9:15 AM</span>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="flex-1 rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">
                  Copy Link
                </button>
                <button className="rounded-md border border-destructive bg-background px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10">
                  Revoke
                </button>
              </div>
            </div>

            <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              + Create Share Link
            </button>

            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium">Select Scope:</p>
              <div className="flex flex-wrap gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs hover:bg-muted">
                  <input type="checkbox" className="rounded" />
                  Labs
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs hover:bg-muted">
                  <input type="checkbox" className="rounded" />
                  Medications
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs hover:bg-muted">
                  <input type="checkbox" className="rounded" />
                  Documents
                </label>
              </div>
              <div className="mt-3">
                <p className="mb-2 text-xs font-medium">Expires In:</p>
                <select className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option>1 hour</option>
                  <option>24 hours</option>
                  <option>7 days</option>
                  <option>Custom...</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* US-5: Privacy Center */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b p-6">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 className="text-lg font-semibold">Privacy Center</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Control your data, consent, and privacy settings
            </p>
          </div>
          <div className="p-6">
            <div className="mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Medication Reminders</p>
                  <p className="text-xs text-muted-foreground">Push notifications for schedules</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" className="peer sr-only" defaultChecked />
                  <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Share Link Analytics</p>
                  <p className="text-xs text-muted-foreground">Track when links are accessed</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" className="peer sr-only" defaultChecked />
                  <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Data Export Emails</p>
                  <p className="text-xs text-muted-foreground">Receive export confirmations</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            </div>

            <div className="my-6 border-t"></div>

            <div className="space-y-2">
              <button className="w-full rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">
                Export All Data (JSON/CSV + Files)
              </button>
              <button className="w-full rounded-md border border-destructive bg-background px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10">
                Delete Account & Data
              </button>
            </div>

            <div className="mt-4 rounded-lg bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Your privacy matters.</span> We never sell your data or show ads.
                <a href="#" className="text-primary underline hover:no-underline">View Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>

        {/* US-6: Provenance */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b p-6">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="text-lg font-semibold">Data Provenance</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Track the source and history of every value
            </p>
          </div>
          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm font-medium">Recent Data Points</p>
            </div>
            <div className="space-y-3">
              <div className="rounded-lg border bg-background p-3">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">Glucose: 95 mg/dL</p>
                    <p className="text-xs text-muted-foreground">Nov 1, 2025 @ 8:30 AM</p>
                  </div>
                  <button className="text-xs text-primary underline hover:no-underline">
                    View Source
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    📄 Lab Report PDF
                  </span>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    ✓ OCR Verified
                  </span>
                </div>
              </div>

              <div className="rounded-lg border bg-background p-3">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">Weight: 72.5 kg</p>
                    <p className="text-xs text-muted-foreground">Nov 3, 2025 @ 7:15 AM</p>
                  </div>
                  <button className="text-xs text-primary underline hover:no-underline">
                    View History
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                    📱 Manual Entry
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    ✏️ Edited by You
                  </span>
                </div>
              </div>

              <div className="rounded-lg border bg-background p-3">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">Cholesterol: 215 mg/dL</p>
                    <p className="text-xs text-muted-foreground">Oct 28, 2025 @ 10:00 AM</p>
                  </div>
                  <button className="text-xs text-primary underline hover:no-underline">
                    View Source
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    📄 Lab Report Image
                  </span>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    ✓ Original Preserved
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">
                Every value links to its source document. Manual edits are tracked and reversible.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
