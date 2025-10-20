import { type Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "T3 - Authentication Page",
  description: "Sign in to your account or create a new one to access your personalized health tracking dashboard.",
};

export default function AuthLayout({
                                     children,
                                   }: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}