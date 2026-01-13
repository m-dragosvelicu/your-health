import "@/shared/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/trpc-provider";
import { AuthSessionProvider } from "@/shared/components/session-provider";
import { AnalyticsProvider } from "@/features/analytics";
import React from "react";

// App-wide metadata for the Next.js App Router. This is used to populate <head>
// and can be extended per-route via nested layouts/pages.
export const metadata: Metadata = {
  title: "Health Tracker",
  description: "Track your health data, medications, and lab results",
  icons: [{ rel: "icon", url: "/favicon2.svg" }],
};

// Load the Geist font and expose its CSS variable so Tailwind can use it.
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Using deep purple brand theme - light mode only
    <html lang="en" className={`${geist.variable}`}>
      <body className="brand-light">
        {/* Provide session context for authentication */}
        <AuthSessionProvider>
          {/* Provide tRPC client context to enable hooks in client components */}
          <TRPCReactProvider>
            {/* Privacy-respecting analytics - tracks usage patterns without PII */}
            <AnalyticsProvider>{children}</AnalyticsProvider>
          </TRPCReactProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
