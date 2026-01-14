import "@/shared/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/trpc-provider";
import { AuthSessionProvider } from "@/shared/components/session-provider";
import React from "react";

// Viewport configuration for PWA
export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// App-wide metadata for the Next.js App Router. This is used to populate <head>
// and can be extended per-route via nested layouts/pages.
export const metadata: Metadata = {
  title: "YHealth - Health Tracker",
  description: "Track your health data, medications, and lab results",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "YHealth",
  },
  applicationName: "YHealth",
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
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
