import Image from "next/image";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

export const metadata = {
  title: "Health Companion | AI Bloodwork & Meds Tracker",
  description:
    "Your smart health companion: OCR + AI to analyze bloodwork, " +
    "track medications, and monitor key health metrics.",
  icon: [{ rel: "icon", url: "/favicon2.svg" }],
};

export default function CompanionLandingPage() {
  return (
    <main className="min-h-dvh bg-gradient-to-b from-background to-secondary/30">
      {/* Top bar */}
      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="size-6 text-primary"
            aria-hidden
          >
            <path
              fill="currentColor"
              d="M12 2c3.866 0 7 3.134 7 7 0 5.25-7 13-7 13S5 14.25 5 9c0-3.866 3.134-7 7-7m0 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5"
            />
          </svg>
          <span>Health Companion</span>
        </Link>
        <nav className="hidden items-center gap-3 sm:flex">
          <Link className="text-sm text-muted-foreground hover:text-foreground" href="#features">
            Features
          </Link>
          <Link className="text-sm text-muted-foreground hover:text-foreground" href="#how-it-works">
            How it works
          </Link>
          <Link className="text-sm text-muted-foreground hover:text-foreground" href="#faq">
            FAQ
          </Link>
          <Button asChild size="sm" className="ml-2">
            <Link href="#cta">Get Started</Link>
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto grid items-center gap-10 px-6 pb-20 pt-8 md:grid-cols-2 md:pt-16">
        <div className="flex flex-col gap-5">
          <Badge className="w-fit" variant="secondary">
            New • AI‑powered health insights
          </Badge>
          <h1 className="text-balance text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
            Your personal health companion for labs, meds, and metrics
          </h1>
          <p className="text-balance text-muted-foreground md:text-lg">
            Snap a photo of your bloodwork to get instant AI insights. Keep your
            medication list current and track key health metrics in one
            secure, privacy‑first place.
          </p>
          <div id="cta" className="flex flex-wrap gap-3">
            <Button size="lg">Create your free account</Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="#demo">See a quick demo</Link>
            </Button>
          </div>
          <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground">
            <span>No payment, no credit card required</span>
            <span>•</span>
            <span>HIPAA‑friendly design</span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-xl bg-primary/10 blur-2xl" />
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-red-500" />
                <div className="size-2 rounded-full bg-yellow-400" />
                <div className="size-2 rounded-full bg-green-500" />
              </div>
              <span className="text-xs text-muted-foreground">Smart Analysis Preview</span>
            </div>
            <div className="grid gap-4 p-2 sm:p-4">
              <div className="grid grid-cols-3 items-center gap-2 text-sm">
                <span className="text-muted-foreground">Hemoglobin</span>
                <div className="col-span-2 flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                  <span>11.2 g/dL</span>
                  <Badge variant="outline" className="text-amber-700 dark:text-amber-300">Low</Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 items-center gap-2 text-sm">
                <span className="text-muted-foreground">LDL</span>
                <div className="col-span-2 flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                  <span>158 mg/dL</span>
                  <Badge variant="outline" className="text-red-700 dark:text-red-300">High</Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 items-center gap-2 text-sm">
                <span className="text-muted-foreground">Vitamin D</span>
                <div className="col-span-2 flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                  <span>24 ng/mL</span>
                  <Badge variant="outline">Below optimal</Badge>
                </div>
              </div>
              <div className="rounded-md bg-secondary/30 p-3 text-xs text-muted-foreground">
                AI note: Consider discussing vitamin D supplementation and lipid
                panel follow‑up with your clinician.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto grid gap-6 px-6 pb-20 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "OCR bloodwork",
            desc:
              "Upload a PDF or snap a photo. We parse ranges, flags, and units for clean insights.",
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-6" aria-hidden>
                <path fill="currentColor" d="M5 2h9l5 5v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2m8 1.5V8h4.5" />
              </svg>
            ),
          },
          {
            title: "AI analysis",
            desc:
              "Evidence‑informed summaries with plain‑language explanations and trends.",
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-6" aria-hidden>
                <path fill="currentColor" d="M2 12a10 10 0 1 1 18.32 6.08l1.63 1.63-1.41 1.41-1.63-1.63A10 10 0 0 1 2 12m10-8a8 8 0 1 0 4.9 14.32l.35-.27.28.28.27.28.28.28.28.28.27.28.28.28 1.02 1.02.7-.7-1.02-1.02-.28-.28-.28-.28-.28-.28-.28-.27-.28-.28-.28-.28-.28-.27.27-.35A7.97 7.97 0 0 0 12 4" />
              </svg>
            ),
          },
          {
            title: "Meds tracking",
            desc:
              "Keep an up‑to‑date medication list, doses, and reminders under your control.",
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-6" aria-hidden>
                <path fill="currentColor" d="M19 3H5a2 2 0 0 0-2 2v4h18V5a2 2 0 0 0-2-2M3 11v8a2 2 0 0 0 2 2h6v-2H5v-8zm16 0a5 5 0 0 0-5 5v5h2v-3h3a5 5 0 0 0 5-5a2 2 0 0 0-2-2zm-4 5a3 3 0 1 1 6 0z" />
              </svg>
            ),
          },
          {
            title: "Metrics & trends",
            desc:
              "Track blood pressure, weight, HbA1c, and more. See trends and flags at a glance.",
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-6" aria-hidden>
                <path fill="currentColor" d="M3 3h2v18H3zm4 8h2v10H7zm4-4h2v14h-2zm4 6h2v8h-2zm4-8h2v16h-2z" />
              </svg>
            ),
          },
        ].map((f) => (
          <div key={f.title} className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="mb-3 text-primary">{f.icon}</div>
            <h3 className="mb-1 text-lg font-semibold">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section id="how-it-works" className="container mx-auto grid gap-6 px-6 pb-20 md:grid-cols-3">
        {[
          {
            step: "1",
            title: "Add your labs",
            desc: "Upload PDFs or photos. We OCR and normalize your results.",
          },
          {
            step: "2",
            title: "Get AI insights",
            desc: "Understand what’s high/low, ranges, and potential actions.",
          },
          {
            step: "3",
            title: "Track meds & metrics",
            desc: "Keep meds current, add vitals, and watch trends over time.",
          },
        ].map((s) => (
          <div key={s.step} className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="mb-2 text-sm text-muted-foreground">Step {s.step}</div>
            <h4 className="mb-1 font-semibold">{s.title}</h4>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer id="faq" className="border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Health Companion. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <Link href="#features" className="hover:text-foreground">
              Features
            </Link>
            <Link href="#how-it-works" className="hover:text-foreground">
              How it works
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
