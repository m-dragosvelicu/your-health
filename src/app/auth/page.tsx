"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";

// Inline brand SVG icons to replace deprecated lucide variants
// These components accept standard SVG props and support Tailwind sizing classes
const GoogleLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
    {...props}
  >
    <path fill="#4285F4" d="M23.49 12.27c0-.84-.07-1.45-.23-2.08H12v3.77h6.53c-.13.94-.84 2.36-2.42 3.31l.02.13 3.51 2.72.24.02c2.23-2.06 3.51-5.1 3.51-8.87z" />
    <path fill="#34A853" d="M12 24c3.2 0 5.88-1.06 7.84-2.89l-3.74-2.9c-1 .68-2.3 1.16-4.1 1.16-3.13 0-5.79-2.06-6.74-4.92l-.14.01-3.82 2.96-.05.13C2.89 21.53 7.1 24 12 24z" />
    <path fill="#FBBC05" d="M5.26 14.45c-.23-.68-.36-1.41-.36-2.16s.13-1.48.35-2.16l-.01-.14-3.86-2.99-.13.06C.44 8.04 0 9.97 0 12c0 2.02.44 3.95 1.25 5.67l4.01-3.22z" />
    <path fill="#EA4335" d="M12 4.75c2.22 0 3.73.96 4.59 1.77l3.35-3.28C17.87 1.08 15.2 0 12 0 7.1 0 2.89 2.47 1.25 6.33L5.6 9.55c.95-2.86 3.61-4.8 6.4-4.8z" />
  </svg>
);

const FacebookLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    aria-hidden
    {...props}
  >
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078V12.07h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.491 0-1.953.925-1.953 1.874v2.264h3.328l-.532 3.472h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const AppleLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    aria-hidden
    {...props}
  >
    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
  </svg>
);

export default function AuthPage() {
  const [mode, setMode] = useState<"signup" | "login">("signup");

  const isSignup = mode === "signup";

  return (
    <main className="min-h-svh bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      <div className="container mx-auto flex min-h-svh items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="relative overflow-hidden rounded-xl border bg-card/95 p-5 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:p-6 md:p-8">
            {/* Toggle */}
            <div className="mb-6 flex justify-center">
              <div className="relative inline-flex w-full max-w-xs items-center rounded-full border bg-background p-1 text-sm">
                {/* Sliding indicator */}
                <div
                  className={`absolute left-1 top-1 h-8 w-[calc(50%-0.25rem)] rounded-full bg-primary/10 transition-transform duration-300 will-change-transform ${
                    isSignup ? "translate-x-0" : "translate-x-full"
                  }`}
                  aria-hidden
                />
                <button
                  type="button"
                  className={`relative z-10 flex-1 rounded-full px-4 py-1.5 transition-colors ${
                    isSignup ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-pressed={isSignup}
                  onClick={() => setMode("signup")}
                >
                  Sign up
                </button>
                <button
                  type="button"
                  className={`relative z-10 flex-1 rounded-full px-4 py-1.5 transition-colors ${
                    !isSignup ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-pressed={!isSignup}
                  onClick={() => setMode("login")}
                >
                  Login
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {isSignup ? "Create your account" : "Welcome back"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {isSignup ? "Start your health journey in minutes." : "Log in to continue to your dashboard."}
              </p>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              {isSignup && (
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your full name"
                    autoComplete="name"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={isSignup ? "Create a strong password" : "Your password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              {isSignup && (
                <div className="space-y-2">
                  <label htmlFor="confirm" className="text-sm font-medium">
                    Confirm password
                  </label>
                  <input
                    id="confirm"
                    name="confirm"
                    type="password"
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              )}

              {!isSignup && (
                <div className="flex justify-end text-sm">
                  <Link href="#" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                    Forgot password?
                  </Link>
                </div>
              )}

              <Button type="submit" className="w-full text-sm sm:text-base">
                {isSignup ? "Create account" : "Login"}
              </Button>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or continue with</span>
                </div>
              </div>

              {/* OAuth buttons */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Button type="button" variant="outline" className="w-full">
                  <GoogleLogo className="size-4" aria-hidden />
                  <span className="sm:not-sr-only sm:whitespace-nowrap">Google</span>
                </Button>
                <Button type="button" variant="outline" className="w-full">
                  <FacebookLogo className="size-4" aria-hidden />
                  <span className="sm:not-sr-only sm:whitespace-nowrap">Facebook</span>
                </Button>
                <Button type="button" variant="outline" className="w-full">
                  <AppleLogo className="size-5" aria-hidden />
                  <span className="sm:not-sr-only sm:whitespace-nowrap">Apple</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Meta links */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing, you agree to our
            {" "}
            <Link href="#" className="underline underline-offset-4 hover:text-foreground">
              Terms
            </Link>{" "}
            and
            {" "}
            <Link href="#" className="underline underline-offset-4 hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
