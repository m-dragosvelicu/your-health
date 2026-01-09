"use client";

import { useEffect, useState } from "react";

import { api } from "~/trpc/trpc-provider";

export function LabReportList() {
  const [status, setStatus] = useState<string>("");
  const [limit, setLimit] = useState<number>(10);

  const query = api.labReport.list.useQuery({ limit });

  useEffect(() => {
    setStatus("");
  }, [limit]);

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Lab Reports</h2>
        <label className="text-xs text-muted-foreground">
          Limit
          <input
            type="number"
            min={5}
            max={50}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value) || 10)}
            className="ml-2 w-20 rounded border bg-background px-2 py-1 text-xs"
          />
        </label>
      </div>

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : query.error ? (
        <p className="text-sm text-destructive">{query.error.message}</p>
      ) : (
        <div className="space-y-2">
          {query.data?.items.length ? (
            query.data.items.map((report) => (
              <div key={report.id} className="rounded border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{report.title ?? "Untitled"}</div>
                  <div className="text-xs text-muted-foreground">{report.status}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Provider: {report.providerName ?? "—"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Collected: {report.collectedAt ? new Date(report.collectedAt).toLocaleString() : "—"}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No lab reports yet.</p>
          )}
        </div>
      )}

      {status && <p className="text-xs text-muted-foreground">{status}</p>}
    </div>
  );
}
