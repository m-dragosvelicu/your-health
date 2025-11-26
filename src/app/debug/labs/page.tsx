import Link from "next/link";

import { LabReportList } from "./report-list";
import { MeasurementList } from "./measurement-list";
import { UploadForm } from "./upload-form";

export const dynamic = "force-dynamic";

export default function LabsDebugPage() {
  return (
    <section className="mx-auto max-w-6xl space-y-8 py-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Internal Debug
        </p>
        <h1 className="text-3xl font-bold">Labs & Measurements</h1>
        <p className="text-sm text-muted-foreground">
          Exercise the MVP endpoints for biomarkers, lab reports, and measurements.
        </p>
        <p className="text-xs text-muted-foreground">
          Biomarkers are read-only (seeded). Lab reports and measurements are user-scoped.
        </p>
        <p className="text-xs text-muted-foreground">
          Quick links: <Link className="underline" href="/debug/biomarkers">Biomarkers</Link> | <Link className="underline" href="/debug/audit">Audit</Link>
        </p>
      </div>

      <UploadForm />

      <LabReportList />

      <MeasurementList />
    </section>
  );
}
