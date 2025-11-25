"use client";

import { useState } from "react";

import { api } from "~/trpc/trpc-provider";

export function MeasurementList() {
  const [limit, setLimit] = useState<number>(10);
  const query = api.measurement.list.useQuery({ limit });

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Measurements</h2>
        <label className="text-xs text-muted-foreground">
          Limit
          <input
            type="number"
            min={5}
            max={100}
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
            query.data.items.map((m) => (
              <div key={m.id} className="rounded border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{m.biomarker.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(m.measuredAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Value: {formatValue(m.value, m.rawValueText)} {m.unit}
                </div>
                <div className="text-xs text-muted-foreground">
                  Flag: {m.flag}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No measurements yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

function formatValue(value: unknown, raw?: string | null) {
  if (typeof value === "string") return value;
  if (value && typeof (value as { toString: () => string }).toString === "function") {
    return (value as { toString: () => string }).toString();
  }
  if (raw) return raw;
  return "—";
}
