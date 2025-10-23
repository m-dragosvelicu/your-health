import { type Metadata } from "next";
import React from "react";

// Route-level metadata for the /auth section
export const metadata: Metadata = {
  title: "T3 - Authentication Page",
  description: "Sign in to your account or create a new one to access your personalized health tracking dashboard.",
};

// Minimal passthrough layout that lets the auth page control its own UI
export default function AuthLayout({
                                     children,
                                   }: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}