import Link from "next/link";
import { notFound } from "next/navigation";

import { rscCaller } from "~/trpc/server";

type LabsDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function LabDetailPage({ params }: LabsDetailPageProps) {
  const { id } = await params;
  const lab = await rscCaller.lab.byId({ id });

  if (!lab) {
    notFound();
  }

  const groupedBySection = lab.tests.reduce<
    Record<string, (typeof lab.tests)[number][]>
  >((acc, test) => {
    const key = test.section ?? "Other";
    const bucket = (acc[key] ??= []);
    bucket.push(test);
    return acc;
  }, {});

  return (
    <section className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Lab details
          </h1>
          <p className="text-sm text-muted-foreground">
            Provider:{" "}
            <span className="font-medium text-foreground">
              {lab.provider}
            </span>
          </p>
        </div>
        <Link
          href="/dashboard/labs"
          className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Back to labs
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Patient
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {lab.patient.firstName ?? "Unknown"}{" "}
            {lab.patient.lastName ?? ""}
          </p>
          {lab.patient.birthdate && (
            <p className="mt-1 text-xs text-muted-foreground">
              Birthdate:{" "}
              <span className="font-medium text-foreground">
                {new Date(lab.patient.birthdate).toLocaleDateString()}
              </span>
            </p>
          )}
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Session
          </p>
          <dl className="mt-2 space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Sampled at</dt>
              <dd className="font-medium text-foreground">
                {lab.sampledAt
                  ? new Date(lab.sampledAt).toLocaleString()
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Result at</dt>
              <dd className="font-medium text-foreground">
                {lab.resultAt
                  ? new Date(lab.resultAt).toLocaleString()
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Imported</dt>
              <dd className="font-medium text-foreground">
                {new Date(lab.createdAt).toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Tests</dt>
              <dd className="font-medium text-foreground">
                {lab.tests.length}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground shadow-sm">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            How this was imported
          </p>
          <p className="mt-2">
            This lab session was parsed from your uploaded report. Values
            below reflect the confirmed data that powers your charts and
            insights.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedBySection).map(([section, tests]) => (
          <div
            key={section}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                {section}
              </p>
              <p className="text-xs text-muted-foreground">
                {tests.length}{" "}
                {tests.length === 1 ? "measurement" : "measurements"}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b text-[0.7rem] uppercase text-muted-foreground">
                  <tr>
                    <th className="pb-2 pr-4">Test</th>
                    <th className="pb-2 pr-4">Value</th>
                    <th className="pb-2 pr-4">Unit</th>
                    <th className="pb-2">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tests.map((test) => (
                    <tr key={test.id}>
                      <td className="py-2 pr-4">
                        <div className="text-xs font-medium text-foreground">
                          {test.name}
                        </div>
                      </td>
                      <td className="py-2 pr-4 align-top">
                        <div className="text-xs font-medium text-foreground">
                          {test.value ?? "—"}
                        </div>
                        {test.value === null && (
                          <div className="text-[0.7rem] text-muted-foreground">
                            Raw: {test.rawValue}
                          </div>
                        )}
                      </td>
                      <td className="py-2 pr-4 align-top text-xs text-muted-foreground">
                        {test.unit ?? "—"}
                      </td>
                      <td className="py-2 align-top text-xs text-muted-foreground">
                        {test.refRaw ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
