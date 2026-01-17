"use client";

import { Suspense, useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/shared/components/ui/button";
import { applyBrandTheme } from "@/shared/lib/brand-theme";

type AuthMode = "signup" | "login" | "reset-password" | "reset-request";

function AuthPageContent() {
  // Local UI state for switching between sign-up and login modes
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const token = searchParams.get("token");
  const modeParam = searchParams.get("mode");
  const initialMode: AuthMode =
    token
      ? "reset-password"
      : modeParam === "login"
        ? "login"
        : modeParam === "reset-request" || modeParam === "reset" || modeParam === "reset-password"
          ? "reset-request"
          : "signup";
  const initialEmailParam = searchParams.get("email");
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [emailValue, setEmailValue] = useState(initialEmailParam ? initialEmailParam.trim() : "");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const emailInputRef = useRef<HTMLInputElement>(null);

  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  // Apply centralized brand theme
  useEffect(() => {
    applyBrandTheme("deep");
  }, []);

  // Redirect authenticated users to dashboard (but not if there's an error being shown)
  useEffect(() => {
    if (status === "authenticated" && session && !error) {
      router.push(callbackUrl);
    }
  }, [status, session, router, callbackUrl, error]);

  const syncAuthQuery = useCallback(
    (nextMode: AuthMode, emailParam?: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("mode", nextMode);
      if (nextMode !== "reset-password") {
        params.delete("token");
      }
      if (emailParam !== undefined) {
        const trimmedEmail = emailParam?.trim() ?? "";
        if (trimmedEmail) {
          params.set("email", trimmedEmail);
        } else {
          params.delete("email");
        }
      }
      const queryString = params.toString();
      router.replace(queryString ? `/auth?${queryString}` : "/auth", { scroll: false });
    },
    [router, searchParams],
  );

  const changeMode = useCallback(
    (nextMode: AuthMode, options?: { email?: string | null; focusEmail?: boolean; preserveError?: boolean }) => {
      setMode(nextMode);
      syncAuthQuery(nextMode, options?.email ?? undefined);
      if (options?.email !== undefined) {
        setEmailValue((options.email ?? "").trim());
      }
      if (options?.focusEmail) {
        requestAnimationFrame(() => {
          emailInputRef.current?.focus();
        });
      }
      setNotice(null);
      if (!options?.preserveError) {
        setError(null);
      }
    },
    [syncAuthQuery],
  );
  const handleForgotPassword = useCallback(() => {
    changeMode("reset-request", { focusEmail: true });
  }, [changeMode]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const form = new FormData(e.currentTarget);
    const nameValue = form.get("name");
    const name = typeof nameValue === "string" ? nameValue.trim() : "";
    const formEmail = form.get("email");
    const trimmedEmail = typeof formEmail === "string" ? formEmail.trim() : "";
    const email = trimmedEmail.toLowerCase();
    setEmailValue(trimmedEmail);
    const passwordValue = form.get("password");
    const password = typeof passwordValue === "string" ? passwordValue : "";
    const confirmValue = form.get("confirm");
    const confirm = typeof confirmValue === "string" ? confirmValue : "";

    if (mode === "reset-request") {
      if (!trimmedEmail) {
        setError("Please enter the email associated with your account.");
        return;
      }

      const res = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data?.error ?? "We couldn't start the reset process. Please try again.");
        return;
      }

      setNotice("If an account exists for that email, you'll receive a reset link shortly.");
      return;
    }

    if (mode === "reset-password") {
      if (!token) {
        setError("Invalid or missing reset token.");
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }

      const res = await fetch("/api/auth/password/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data?.error ?? "Failed to reset password. The link may be invalid or expired.");
        return;
      }

      changeMode("login", { email: trimmedEmail, focusEmail: true });
      // Show a success message or automatically sign in
      alert("Password has been reset successfully. Please log in with your new password.");
      return;
    }

    if (mode === "signup") {
      // Client-side validation
      if (!trimmedEmail) {
        setError("Please enter your email address.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (password.length > 100) {
        setError("Password is too long (max 100 characters).");
        return;
      }
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
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          issues?: { fieldErrors?: Record<string, string[]> };
        };
        if (res.status === 409) {
          setError(data?.error ?? "An account with this email already exists. Please log in.");
          changeMode("login", { email: trimmedEmail, focusEmail: true, preserveError: true });
          return;
        }

        // Parse validation errors for better feedback
        const fieldErrors = data?.issues?.fieldErrors;
        if (fieldErrors) {
          if (fieldErrors.email?.length) {
            setError("Please enter a valid email address.");
            return;
          }
          if (fieldErrors.password?.length) {
            setError(fieldErrors.password[0] ?? "Invalid password.");
            return;
          }
        }

        setError(data?.error ?? "Registration failed. Please check your details.");
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
        window.location.assign("/dashboard");
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

  const isSignup = mode === "signup";
  const isReset = mode === "reset-password";
  const isResetRequest = mode === "reset-request";

  return (
    <main className="brand-light min-h-svh bg-background text-foreground">
      <style>{`
        .glass-card {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.3);
        }
      `}</style>
      <div className="container mx-auto flex min-h-svh items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="glass-card relative overflow-hidden rounded-2xl p-6 shadow-2xl sm:p-8 md:p-10">
            {/* Toggle */}
            {!(isReset || isResetRequest) && <div className="mb-8 flex justify-center">
              <div className="relative inline-flex w-full max-w-xs items-center rounded-full border border-white/20 bg-white/50 p-1 text-sm backdrop-blur">
                {/* Sliding indicator */}
                {/* Sliding pill indicator that moves between "Sign up" and "Login" based on current mode */}
                <div
                  className={`absolute left-1 top-1 h-8 w-[calc(50%-0.25rem)] rounded-full transition-all duration-300 will-change-transform ${
                    isSignup ? "translate-x-0" : "translate-x-full"
                  }`}
                  style={{ backgroundColor: "var(--brand-primary)" }}
                  aria-hidden
                />
                <button
                  type="button"
                  className={`relative z-10 flex-1 rounded-full px-4 py-1.5 font-semibold transition-colors ${
                    isSignup ? "text-white" : "text-slate-700 hover:text-slate-900"
                  }`}
                  aria-pressed={isSignup}
                  onClick={() => changeMode("signup")}
                >
                  Sign up
                </button>
                <button
                  type="button"
                  className={`relative z-10 flex-1 rounded-full px-4 py-1.5 font-semibold transition-colors ${
                    !isSignup ? "text-white" : "text-slate-700 hover:text-slate-900"
                  }`}
                  aria-pressed={!isSignup}
                  onClick={() => changeMode("login")}
                >
                  Login
                </button>
              </div>
            </div>}

            {/* Title */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {isReset
                  ? "Reset your password"
                  : isResetRequest
                    ? "Forgot your password?"
                    : isSignup
                      ? "Create your account"
                      : "Welcome back"}
              </h1>
              {isReset && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Choose a new password to secure your account.
                </p>
              )}
              {isResetRequest && (
                <>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Enter your account email and we&apos;ll send you a reset link.
                  </p>
                  <button
                    type="button"
                    onClick={() => changeMode("login", { focusEmail: true })}
                    className="text-sm underline underline-offset-4"
                  >
                    Remember your password? Log in
                  </button>
                </>
              )}
              {!(isReset || isResetRequest) && (
                <button
                  type="button"
                  onClick={() => changeMode(mode === "signup" ? "login" : "signup")}
                  className="text-sm underline underline-offset-4"
                >
                  {mode === "signup" ? "Have an account? Log in" : "New here? Sign up"}
                </button>
              )}
            </div>

            {/* Form */}
            {/* Demo-only: prevent actual submission; integrate with your auth logic (NextAuth, tRPC mutation, etc.) */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* The `name` field is only for signup */}
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
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white/50 px-4 text-sm backdrop-blur transition-all focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                  />
                </div>
              )}

              <div className="space-y-2">
                {/* The email field is read-only during password reset */}
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
                  value={emailValue}
                  onChange={(event) => setEmailValue(event.target.value)}
                  ref={emailInputRef}
                  readOnly={isReset}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white/50 px-4 text-sm backdrop-blur transition-all focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                />
              </div>

              {!isResetRequest && (
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    placeholder={isSignup ? "Create a strong password" : isReset ? "Enter new password" : "Your password"}
                    autoComplete={isSignup || isReset ? "new-password" : "current-password"}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white/50 px-4 text-sm backdrop-blur transition-all focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                  />
                  {isSignup && (
                    <p className="text-xs text-muted-foreground">At least 8 characters</p>
                  )}
                </div>
              )}
              {/* The "confirm password" field is for signup and reset */}
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
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white/50 px-4 text-sm backdrop-blur transition-all focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                  />
                </div>
              )}

              {isReset && (
                  <div className="space-y-2">
                    <label htmlFor="confirm" className="text-sm font-medium">
                      Confirm new password
                    </label>
                    <input
                        id="confirm"
                        name="confirm"
                        type="password"
                        required
                        placeholder="Repeat new password"
                        autoComplete="new-password"
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white/50 px-4 text-sm backdrop-blur transition-all focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                    />
                  </div>
              )}

              <div className="flex items-center justify-between text-sm">
                {mode === "login" ? (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="border-0 bg-transparent p-0 text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </button>
                ) : (
                  <span />
                )}
                {isPending && <span className="text-xs text-muted-foreground">Processing...</span>}
              </div>

              <Button
                type="submit"
                className="w-full text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl sm:text-base"
                style={{ backgroundColor: "var(--brand-primary)" }}
                disabled={isPending}
              >
                {isReset ? "Set new password" : isResetRequest ? "Send reset link" : isSignup ? "Create account" : "Login"}
              </Button>

              {notice && (
                <p className="text-sm text-emerald-600 dark:text-emerald-500" role="status" aria-live="polite">
                  {notice}
                </p>
              )}

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
