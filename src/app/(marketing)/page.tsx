"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Bell,
  FileText,
  LineChart,
  Link2,
  ScanLine,
  Shield,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { applyBrandTheme } from "@/shared/lib/brand-theme";

export default function Home() {
  const heroRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  useEffect(() => {
    applyBrandTheme("deep");
  }, []);

  const features = [
    {
      icon: ScanLine,
      title: "Scan & Import Labs",
      subtitle: "OCR Magic",
      description:
        "Snap a photo of your lab report. Get clean, editable results in seconds. Original files preserved for provenance.",
      highlights: ["10s import time", "Auto-extract values", "Edit & verify"],
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: LineChart,
      title: "Timeline & Trends",
      subtitle: "Visual Insights",
      description:
        "See your health metrics over time with reference ranges. Understand what's improving with color-coded trends.",
      highlights: [
        "In-range shading",
        "Unit conversion",
        "Plain-language tips",
      ],
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Bell,
      title: "Smart Medication Tracking",
      subtitle: "Never Miss a Dose",
      description:
        "Log meds in 2 taps. Forgiving reminders that adapt to your life. No spam, just support.",
      highlights: [
        "Take/Snooze/Skip",
        "Adherence tracking",
        "Smart scheduling",
      ],
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Link2,
      title: "Secure Sharing",
      subtitle: "Time-Limited Access",
      description:
        "Share exactly what your doctor needs. Set expiry times. Revoke anytime. Full access control.",
      highlights: ["Scoped permissions", "One-pager view", "Access logs"],
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Shield,
      title: "Privacy First",
      subtitle: "Your Data, Your Control",
      description:
        "Export everything. Delete anytime. No ads, no selling. Complete transparency and control.",
      highlights: ["Full export", "One-click delete", "Clear consent"],
      color: "from-indigo-500 to-purple-500",
    },
    {
      icon: FileText,
      title: "Provenance Tracking",
      subtitle: "Trust Every Number",
      description:
        "Every value shows its source. Original documents one click away. Full audit trail for peace of mind.",
      highlights: ["Source tracking", "Edit history", "Original files"],
      color: "from-teal-500 to-blue-500",
    },
  ] as const;

  return (
    <div className="brand-light bg-background text-foreground min-h-screen">
      <style>{`
        .glass-card { background: rgba(255,255,255,0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.3); }
        .glass-card-strong { background: rgba(255,255,255,0.9); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); border: 1px solid rgba(255,255,255,0.5); }
        .hero-background { position:absolute; inset:0; background-image:url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6900b65042f4ed37e88bbec3/dee80d413_yourhealthbackground_new.jpg'); background-size:cover; background-position:center; background-repeat:no-repeat; opacity:0.3; }
      `}</style>

      {/* Header */}
      <header className="glass-card fixed top-0 right-0 left-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <span className="text-foreground text-2xl font-bold">
                Your
                <span style={{ color: "var(--brand-primary)" }}>Health</span>
              </span>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/auth" className="text-sm">
                  Sign in
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative flex min-h-screen items-center justify-center overflow-hidden px-6"
      >
        {/* Background Image (optimized) */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-bg.jpeg"
            alt=""
            priority
            sizes="100vw"
            fill
            className="object-cover"
          />
          <div className="from-background/70 via-background/50 to-background/70 absolute inset-0 bg-gradient-to-b" />
        </div>

        {/* Content */}
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 mx-auto max-w-5xl text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <h1 className="text-foreground mb-8 text-7xl leading-tight font-bold lg:text-8xl">
              Start taking care of{" "}
              <span style={{ color: "var(--brand-primary)" }}>Your</span>Health
              today!
            </h1>
            <p className="mx-auto mb-12 max-w-3xl text-3xl leading-relaxed text-slate-600">
              Track your bloodwork and treatments all in one place.
            </p>
            <Button
              size="lg"
              className="rounded-full px-14 py-8 text-2xl font-semibold text-white shadow-2xl transition-all hover:scale-105"
              style={{ backgroundColor: "var(--brand-primary)" }}
              asChild
            >
              <Link href="/auth">Sign up!</Link>
            </Button>
          </motion.div>

          {/* Scroll indicator */}
        </motion.div>
      </section>

      {/* Problem Statement */}
      <section className="relative flex min-h-[80svh] items-center justify-center px-6 py-24 md:py-48">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-foreground mb-8 text-5xl leading-tight font-bold">
              Stop juggling{" "}
              <span style={{ color: "var(--brand-primary)" }}>
                multiple portals, PDFs, and apps
              </span>
            </h2>
            <p className="text-2xl leading-relaxed text-slate-600">
              Your health data is scattered. You're wasting time, missing doses,
              and walking into appointments unprepared. There's a better way.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-32">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="mb-32 text-center"
          >
            <h2 className="text-foreground mb-6 text-6xl font-bold">
              Everything you need to{" "}
              <span style={{ color: "var(--brand-primary)" }}>
                manage your health
              </span>
            </h2>
          </motion.div>

          <div className="space-y-64">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 80 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-150px" }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={`grid items-center gap-16 lg:grid-cols-2 ${index % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
              >
                {/* Content Side */}
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <Badge
                    className="mb-4 border-0 px-4 py-2 text-sm font-medium"
                    style={{
                      backgroundColor: "var(--brand-bg-100)",
                      color: "var(--brand-text)",
                    }}
                  >
                    {feature.subtitle}
                  </Badge>

                  <h3 className="mb-4 text-4xl font-bold text-slate-900">
                    {feature.title}
                  </h3>

                  <p className="mb-8 text-xl leading-relaxed text-slate-600">
                    {feature.description}
                  </p>

                  {/* Highlights */}
                  <div className="space-y-3">
                    {feature.highlights.map((highlight, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <div
                          className="flex h-6 w-6 items-center justify-center rounded-full"
                          style={{ backgroundColor: "var(--brand-primary)" }}
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true }}
                            transition={{
                              delay: 0.5 + i * 0.1,
                              type: "spring",
                            }}
                          >
                            <ArrowRight className="h-4 w-4 text-white" />
                          </motion.div>
                        </div>
                        <span className="font-medium text-slate-700">
                          {highlight}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Visual Side: icon only */}
                <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                  <div className="flex items-center justify-center py-12">
                    <feature.icon
                      className="h-28 w-28 text-[var(--brand-primary)]"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-40">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <div
              className="glass-card-strong rounded-3xl p-20 text-center shadow-2xl"
              style={{ boxShadow: `0 30px 60px -15px var(--brand-primary-40)` }}
            >
              <h2 className="text-foreground mb-8 text-6xl font-bold">
                Ready to take control?
              </h2>
              <p className="mx-auto mb-12 max-w-2xl text-2xl leading-relaxed text-slate-600">
                Join thousands of people who've simplified their health data
                management. No credit card required.
              </p>
              <Button
                size="lg"
                className="rounded-full px-16 py-10 text-2xl font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
                style={{ backgroundColor: "var(--brand-primary)" }}
                asChild
              >
                <Link href="/auth">
                  Get Started Free
                  <ArrowRight className="ml-3 h-7 w-7" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/30 px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-foreground text-xl font-bold">
                Your
                <span style={{ color: "var(--brand-primary)" }}>Health</span>
              </span>
            </div>
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} YourHealth. Your health data,
              organized and secure.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
