"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
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

const DiscordLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    aria-hidden
    {...props}
  >
    <path d="M20.82 4.62A17.62 17.62 0 0 0 16.52 3a12.38 12.38 0 0 0-.58 1.19 16.76 16.76 0 0 0-4-.1a15.32 15.32 0 0 0-.67-1.16 17.56 17.56 0 0 0-4.3 1.66A20.2 20.2 0 0 0 3 17.34a17.94 17.94 0 0 0 5.27 2.7 13 13 0 0 0 1.12-1.7 10.84 10.84 0 0 1-1.76-.85c.15-.11.3-.23.44-.35a12.5 12.5 0 0 0 10.9 0c.14.12.29.24.44.35a11.88 11.88 0 0 1-1.81.88 11.7 11.7 0 0 0 1.14 1.68 17.84 17.84 0 0 0 5.26-2.7 20.07 20.07 0 0 0-3.18-12.33ZM9.55 15.26c-1.05 0-1.9-1-1.9-2.26s.83-2.27 1.9-2.27 1.92 1 1.9 2.27-.85 2.26-1.9 2.26Zm4.9 0c-1.05 0-1.9-1-1.9-2.26s.83-2.27 1.9-2.27 1.92 1 1.9 2.27-.85 2.26-1.9 2.26Z" />
  </svg>
);

export default function AuthPage() {
  // Local UI state for switching between sign-up and login modes
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [loadingProvider, setLoadingProvider] = useState<"google" | "discord" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const handleOAuthSignIn = useCallback(
    async (provider: "google" | "discord") => {
      setError(null);
      setLoadingProvider(provider);
      try {
        const response = await signIn(provider, {
          callbackUrl,
        });

        if (response?.error) {
          setError("We couldn\u2019t complete the sign-in. Please try again.");
        }
      } catch (err) {
        console.error(`Error during ${provider} sign-in`, err);
        setError("We couldn\u2019t complete the sign-in. Please try again.");
      } finally {
        setLoadingProvider(null);
      }
    },
    [callbackUrl],
  );

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
                {/* Sliding pill indicator that moves between "Sign up" and "Login" based on current mode */}
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
            {/* Demo-only: prevent actual submission; integrate with your auth logic (NextAuth, tRPC mutation, etc.) */}
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

              {/* OAuth provider buttons, wired to NextAuth handlers */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => void handleOAuthSignIn("google")}
                  disabled={loadingProvider !== null}
                >
                  <GoogleLogo className="size-4" aria-hidden />
                  <span className="sm:not-sr-only sm:whitespace-nowrap">
                    {loadingProvider === "google" ? "Connecting..." : "Google"}
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => void handleOAuthSignIn("discord")}
                  disabled={loadingProvider !== null}
                >
                  <DiscordLogo className="size-4" aria-hidden />
                  <span className="sm:not-sr-only sm:whitespace-nowrap">
                    {loadingProvider === "discord" ? "Connecting..." : "Discord"}
                  </span>
                </Button>
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert" aria-live="polite">
                  {error}
                </p>
              )}
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
