"use client";
// Client Component: uses useEffect/useRef and DOM APIs for the carousel, so it must run on the client

import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useEffect, useRef } from "react";

export default function CompanionLandingPage() {
  // Ref for the horizontally scrollable carousel container. We only access it on the client.
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    // Auto-scroll the horizontal carousel every 4 seconds.
    // The scroll pauses while the user hovers, and resumes when the mouse leaves.
    // When reaching the end, we smoothly jump back to the start.
    let scrollInterval: NodeJS.Timeout;
    let isPaused = false;

    const startAutoScroll = () => {
      scrollInterval = setInterval(() => {
        if (isPaused) return; // do nothing while paused via hover

        const maxScroll = carousel.scrollWidth - carousel.clientWidth;
        const currentScroll = carousel.scrollLeft;

        if (currentScroll >= maxScroll) {
          // Reset to the beginning when we've reached the end of the scroll range
          carousel.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          // Advance by ~90% of the visible width for an overlapping, smooth carousel effect
          carousel.scrollBy({ left: carousel.clientWidth * 0.9, behavior: "smooth" });
        }
      }, 4000);
    };

    // Toggle pause while the user hovers the carousel
    const handleMouseEnter = () => (isPaused = true);
    const handleMouseLeave = () => (isPaused = false);

    carousel.addEventListener("mouseenter", handleMouseEnter);
    carousel.addEventListener("mouseleave", handleMouseLeave);

    startAutoScroll();

    // Cleanup the interval and listeners when the component unmounts
    return () => {
      clearInterval(scrollInterval);
      carousel.removeEventListener("mouseenter", handleMouseEnter);
      carousel.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

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
            <Link href="/auth">Get Started</Link>
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
            Take control of your health journey with AI-powered insights
          </h1>
          <p className="text-balance text-muted-foreground md:text-lg">
            Keep track of your bloodwork results, treatments, and medical appointments—all in one secure place.
            With a simple interface, clear charts, and AI-powered analysis, managing your health has never been easier.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-5 text-green-500" fill="currentColor">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2m-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z" />
              </svg>
              <span>Upload lab results instantly</span>
            </div>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-5 text-green-500" fill="currentColor">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2m-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z" />
              </svg>
              <span>AI-powered analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-5 text-green-500" fill="currentColor">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2m-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z" />
              </svg>
              <span>Track medications & appointments</span>
            </div>
          </div>
          <div id="cta" className="flex flex-wrap gap-3">
            <Button size="lg" className="text-base"><Link href="/auth">Get Started Free</Link></Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#demo">Watch Demo</Link>
            </Button>
          </div>
          <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground">
            <span>✓ No credit card required</span>
            <span>•</span>
            <span>✓ HIPAA‑compliant</span>
            <span>•</span>
            <span>✓ Bank-level encryption</span>
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

      {/* Stats Section */}
      <section className="border-y bg-secondary/20 py-12">
        <div className="container mx-auto px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">10K+</div>
              <div className="mt-2 text-sm text-muted-foreground">Lab Reports Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">98%</div>
              <div className="mt-2 text-sm text-muted-foreground">OCR Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">50+</div>
              <div className="mt-2 text-sm text-muted-foreground">Biomarkers Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">24/7</div>
              <div className="mt-2 text-sm text-muted-foreground">Secure Access</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4">Features</Badge>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Everything you need to manage your health</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground md:text-lg">
            From AI-powered bloodwork analysis to medication tracking, we provide the tools you need to stay informed and in control.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
          <div key={f.title} className="group rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50">
            <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary/20">{f.icon}</div>
            <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
        </div>
      </section>

      {/* Feature carousel */}
      <section id="demo" className="bg-secondary/20 py-20">
        <div className="container mx-auto px-6">
          <div className="mb-8 text-center">
            <Badge variant="secondary" className="mb-4">See It In Action</Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Explore the features</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Hover to pause, or let it auto-scroll through our comprehensive feature set. Built with simplicity and clarity in mind.
            </p>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-secondary/20 to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-secondary/20 to-transparent" />
            {/* Horizontal snap-scrolling container for the feature cards. We hide native scrollbars
                and rely on CSS scroll snapping for a smooth carousel feel. */}
            <div ref={carouselRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              {
                title: "AI bloodwork insights",
                desc: "Upload a lab report and get plain-language explanations, flags, and next-step ideas.",
                bullets: ["Range-aware parsing", "Trend detection", "Shareable summaries"],
                icon: (
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' className='size-6' aria-hidden>
                    <path fill='currentColor' d='M2 12a10 10 0 1 1 18.32 6.08l1.63 1.63-1.41 1.41-1.63-1.63A10 10 0 0 1 2 12m10-8a8 8 0 1 0 4.9 14.32l.35-.27.28.28.27.28.28.28.28.28.27.28.28.28 1.02 1.02.7-.7-1.02-1.02-.28-.28-.28-.28-.28-.28-.28-.27-.28-.28-.28-.28-.28-.27.27-.35A7.97 7.97 0 0 0 12 4' />
                  </svg>
                ),
              },
              {
                title: "Medication tracker",
                desc: "Keep an accurate, up-to-date med list with doses, schedules, and reminders.",
                bullets: ["Doses & schedules", "Refill reminders", "Interaction alerts (coming soon)"],
                icon: (
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' className='size-6' aria-hidden>
                    <path fill='currentColor' d='M19 3H5a2 2 0 0 0-2 2v4h18V5a2 2 0 0 0-2-2M3 11v8a2 2 0 0 0 2 2h6v-2H5v-8zm16 0a5 5 0 0 0-5 5v5h2v-3h3a5 5 0 0 0 5-5a2 2 0 0 0-2-2zm-4 5a3 3 0 1 1 6 0z' />
                  </svg>
                ),
              },
              {
                title: "Appointments & notes",
                desc: "Organize upcoming visits and jot down questions to bring to your clinician.",
                bullets: ["Calendar view", "Smart reminders", "Visit summaries"],
                icon: (
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' className='size-6' aria-hidden>
                    <path fill='currentColor' d='M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2m0 14H5V10h14z' />
                  </svg>
                ),
              },
              {
                title: "Charts & trends",
                desc: "Visualize blood pressure, HbA1c, cholesterol, and more over time.",
                bullets: ["Sparkline trends", "Flagged outliers", "Export data"],
                icon: (
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' className='size-6' aria-hidden>
                    <path fill='currentColor' d='M3 3h2v18H3zm4 8h2v10H7zm4-4h2v14h-2zm4 6h2v8h-2zm4-8h2v16h-2z' />
                  </svg>
                ),
              },
              {
                title: "Secure health vault",
                desc: "Your information stays private with encryption and a privacy-first design.",
                bullets: ["Encryption at rest", "Encryption in transit", "You control sharing"],
                icon: (
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' className='size-6' aria-hidden>
                    <path fill='currentColor' d='M12 1a5 5 0 0 0-5 5v3H5a2 2 0 0 0-2 2v9h18v-9a2 2 0 0 0-2-2h-2V6a5 5 0 0 0-5-5m0 2a3 3 0 0 1 3 3v3H9V6a3 3 0 0 1 3-3' />
                  </svg>
                ),
              },
              {
                title: "AI roadmap",
                desc: "We’re building new AI tools for pattern detection and tailored insights.",
                bullets: ["Longitudinal analysis", "Personalized ranges", "Care team sharing"],
                icon: (
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' className='size-6' aria-hidden>
                    <path fill='currentColor' d='M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2m1 15h-2v-2h2zm0-4h-2V7h2z' />
                  </svg>
                ),
              },
            ].map((c) => (
              <div key={c.title} className="group min-w-[85%] snap-start rounded-xl border bg-card p-6 shadow-md transition-all hover:shadow-lg sm:min-w-[420px] lg:min-w-[520px]">
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary/20">{c.icon}</div>
                <h3 className="mb-3 text-xl font-semibold">{c.title}</h3>
                <p className="mb-4 text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                <ul className="mb-5 space-y-2 text-sm">
                  {c.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-5 shrink-0 text-green-500 mt-0.5" fill="currentColor">
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2m-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z" />
                      </svg>
                      <span className="text-muted-foreground">{b}</span>
                    </li>
                  ))}
                </ul>
                <Button size="sm" variant="secondary" className="w-full" asChild>
                  <a href="#features" aria-label={`Learn more about ${c.title}`}>Learn more</a>
                </Button>
              </div>
            ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="container mx-auto px-6 py-20">
        <div className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4">How It Works</Badge>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Get started in 3 simple steps</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground md:text-lg">
            Our streamlined process makes it easy to start managing your health data today.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Upload Your Labs",
              desc: "Simply upload PDFs or snap photos of your lab results. Our advanced OCR technology extracts and normalizes all the data automatically.",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-8" fill="currentColor">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm4 18H6V4h7v5h5v11M8 12v2h8v-2H8m0 4v2h5v-2H8Z" />
                </svg>
              ),
            },
            {
              step: "2",
              title: "Get AI Insights",
              desc: "Our AI analyzes your results and provides plain-language explanations of what's normal, high, or low, plus actionable next steps.",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-8" fill="currentColor">
                  <path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10m2.03 0v8.99H22c-.47-4.74-4.24-8.52-8.97-8.99m0 11.01V22c4.74-.47 8.5-4.25 8.97-8.99h-8.97Z" />
                </svg>
              ),
            },
            {
              step: "3",
              title: "Track & Monitor",
              desc: "Keep your medications up to date, log vital metrics, and watch trends over time with beautiful, easy-to-read charts.",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-8" fill="currentColor">
                  <path d="M16 11.78l4.24-7.33 1.73 1-5.23 9.05-6.51-3.75L5.46 19H22v2H2V3h2v14.54L9.5 8l6.5 3.78Z" />
                </svg>
              ),
            },
          ].map((s) => (
            <div key={s.step} className="relative rounded-xl border bg-card p-8 shadow-sm">
              <div className="absolute -top-4 left-8 flex size-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground shadow-lg">
                {s.step}
              </div>
              <div className="mb-4 mt-4 text-primary">{s.icon}</div>
              <h4 className="mb-3 text-xl font-semibold">{s.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-secondary/20 py-20">
        <div className="container mx-auto px-6">
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-4">Testimonials</Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">What our users say</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground md:text-lg">
              Join thousands of people taking control of their health data.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                quote: "Finally, a way to keep track of all my lab results in one place. The AI insights help me understand what my numbers actually mean.",
                author: "Sarah M.",
                role: "Managing Diabetes",
              },
              {
                quote: "The medication tracking feature has been a game-changer. I never miss a dose, and I can easily share my med list with my doctors.",
                author: "James K.",
                role: "Heart Disease Patient",
              },
              {
                quote: "Being able to see trends in my bloodwork over time has given me so much more insight into my health. The charts are clear and easy to understand.",
                author: "Maria L.",
                role: "Wellness Enthusiast",
              },
            ].map((t, i) => (
              <div key={i} className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex gap-1 text-yellow-500">
                  {[Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-5" fill="currentColor">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <p className="mb-4 text-sm italic text-muted-foreground leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="border-t pt-4">
                  <div className="font-semibold text-sm">{t.author}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container mx-auto px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-4">FAQ</Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Frequently asked questions</h2>
            <p className="text-muted-foreground">Everything you need to know about our platform.</p>
          </div>
          <div className="space-y-4">
            <details className="group rounded-lg border bg-card p-5 open:shadow-md">
              <summary className="cursor-pointer list-none font-medium flex items-center justify-between">
                <span>How does the AI analyze my bloodwork?</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-5 text-muted-foreground transition-transform group-open:rotate-180" fill="currentColor">
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                We use advanced OCR technology combined with AI models trained on medical literature to extract values, reference ranges, and flags from your lab reports.
                The AI then generates plain-language explanations that help you understand what your results mean, highlighting any values that are outside normal ranges
                and providing context about what those changes might indicate. You always maintain full control over what you upload and share.
              </p>
            </details>
            <details className="group rounded-lg border bg-card p-5 open:shadow-md">
              <summary className="cursor-pointer list-none font-medium flex items-center justify-between">
                <span>Is my health data secure and private?</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-5 text-muted-foreground transition-transform group-open:rotate-180" fill="currentColor">
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Absolutely. We take your privacy seriously. All data is encrypted both in transit (using TLS) and at rest (using AES-256 encryption).
                We&apos;re built with a privacy-first, HIPAA-compliant architecture. Your data belongs to you—we never sell it to third parties,
                and you can export or delete it at any time. We also support two-factor authentication for an extra layer of security.
              </p>
            </details>
            <details className="group rounded-lg border bg-card p-5 open:shadow-md">
              <summary className="cursor-pointer list-none font-medium flex items-center justify-between">
                <span>Can this replace my doctor or medical advice?</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-5 text-muted-foreground transition-transform group-open:rotate-180" fill="currentColor">
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                No. Our platform is designed to be a complementary tool that helps you better understand and organize your health information.
                The AI provides educational insights and pattern recognition, not medical advice or diagnoses. Always consult with your healthcare
                provider for medical decisions, treatment plans, and professional medical advice. Think of us as your health data companion, not a replacement for professional care.
              </p>
            </details>
            <details className="group rounded-lg border bg-card p-5 open:shadow-md">
              <summary className="cursor-pointer list-none font-medium flex items-center justify-between">
                <span>What file formats do you support for lab results?</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-5 text-muted-foreground transition-transform group-open:rotate-180" fill="currentColor">
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                We support a wide variety of formats including PDF documents, JPG, PNG, and other common image formats. Our OCR technology is optimized
                to work with lab reports from major providers and can handle both digital PDFs and scanned documents. If you have a format we don&apos;t
                currently support, you can always manually enter your results, and we&apos;re constantly expanding our format support based on user feedback.
              </p>
            </details>
            <details className="group rounded-lg border bg-card p-5 open:shadow-md">
              <summary className="cursor-pointer list-none font-medium flex items-center justify-between">
                <span>How much does it cost?</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-5 text-muted-foreground transition-transform group-open:rotate-180" fill="currentColor">
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                We offer a free tier that includes basic features like uploading lab results, tracking medications, and viewing trends. For advanced
                features like unlimited AI insights, longitudinal analysis, and priority support, we offer premium plans starting at $9.99/month.
                No credit card is required to start, and you can always upgrade or downgrade your plan as your needs change.
              </p>
            </details>
            <details className="group rounded-lg border bg-card p-5 open:shadow-md">
              <summary className="cursor-pointer list-none font-medium flex items-center justify-between">
                <span>Can I share my data with my healthcare providers?</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-5 text-muted-foreground transition-transform group-open:rotate-180" fill="currentColor">
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Yes! You can easily generate shareable reports in PDF format or grant temporary access to specific healthcare providers. You have complete
                control over what information is shared and for how long. Many of our users bring their trend charts and AI-generated summaries to their
                appointments to facilitate more productive conversations with their doctors.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Ready to take control of your health?</h2>
            <p className="mb-8 text-muted-foreground md:text-lg">
              Join thousands of people using Health Companion to better understand and manage their health data.
              Get started today—no credit card required.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="text-base">Create Free Account</Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#demo">See How It Works</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Free forever • No credit card • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
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
