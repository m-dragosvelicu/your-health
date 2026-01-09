// src/app/debug/biomarkers/page.tsx
import { redirect } from "next/navigation";

import { auth } from "@/shared/server/auth";
import { BiomarkerBrowserDebugClient } from "./biomarker-browser-debug-client";

export const dynamic = "force-dynamic";

export default async function BiomarkerDebugPage() {
  const session = await auth();
  if (!session) {
    redirect("/auth");
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6 py-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Internal Debug
        </p>
        <h1 className="text-3xl font-bold">Biomarker Catalog</h1>
        <p className="text-sm text-muted-foreground">
          Quick peek at seeded biomarkers. Use the inputs below to filter by
          search term or adjust the limit while debugging.
        </p>
      </div>

      <BiomarkerBrowserDebugClient />
    </section>
  );
}
