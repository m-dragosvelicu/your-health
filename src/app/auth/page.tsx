"use client";

import { Suspense, useCallback, useState, useTransition } from "react";
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

function AuthPageContent() {
  // Local UI state for switching between sign-up and login modes
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [loadingProvider, setLoadingProvider] = useState<"google" | "discord" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const nameValue = form.get("name");
    const name = typeof nameValue === "string" ? nameValue.trim() : "";
    const emailValue = form.get("email");
    const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
    const passwordValue = form.get("password");
    const password = typeof passwordValue === "string" ? passwordValue : "";
    const confirmValue = form.get("confirm");
    const confirm = typeof confirmValue === "string" ? confirmValue : "";

    if (mode === "signup") {
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, email, password }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data?.error ?? "Registration failed.");
        return;
      }

      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError("Account created but sign-in failed. Try logging in.");
        return;
      }

      startTransition(() => {
        window.location.assign(callbackUrl);
      });
      return;
    }

    // Login flow
    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (signInRes?.error) {
      setError("Invalid email or password.");
      return;
    }

    startTransition(() => {
      window.location.assign(callbackUrl);
    });
  }

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
              <button
                onClick={() => setMode((m) => (m === "signup" ? "login" : "signup"))}
                className="text-sm underline underline-offset-4"
              >
                {mode === "signup" ? "Have an account? Log in" : "New here? Sign up"}
              </button>
            </div>

            {/* Form */}
            {/* Demo-only: prevent actual submission; integrate with your auth logic (NextAuth, tRPC mutation, etc.) */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === "signup" && (
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
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm shadow-xs"
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
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm shadow-xs"
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
                  required
                  placeholder={mode === "signup" ? "Create a strong password" : "Your password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm shadow-xs"
                />
              </div>

              {mode === "signup" && (
                <div className="space-y-2">
                  <label htmlFor="confirm" className="text-sm font-medium">
                    Confirm password
                  </label>
                  <input
                    id="confirm"
                    name="confirm"
                    type="password"
                    required
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm shadow-xs"
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                {mode === "login" ? (
                  <Link href="#" className="text-muted-foreground underline-offset-4 hover:underline">
                    Forgot password?
                  </Link>
                ) : (
                  <span />
                )}
                {isPending && <span className="text-xs text-muted-foreground">Processing…</span>}
              </div>

              <Button type="submit" className="w-full text-sm sm:text-base" disabled={isPending}>
                {mode === "signup" ? "Create account" : "Login"}
              </Button>

              {/* OAuth sign-in options */}
              <div className="relative py-2">
                <div className="my-2 flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">or continue with</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOAuthSignIn("google")}
                    disabled={isPending || loadingProvider === "google"}
                  >
                    <GoogleLogo className="mr-2 h-4 w-4" aria-hidden />
                    {loadingProvider === "google" ? "Signing in..." : "Google"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOAuthSignIn("discord")}
                    disabled={isPending || loadingProvider === "discord"}
                  >
                    <DiscordLogo className="mr-2 h-4 w-4" aria-hidden />
                    {loadingProvider === "discord" ? "Signing in..." : "Discord"}
                  </Button>
                </div>
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

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
