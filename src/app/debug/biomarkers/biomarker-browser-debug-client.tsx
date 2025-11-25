// src/app/debug/biomarkers/biomarker-browser-debug-client.tsx
"use client";

import { useMemo, useState } from "react";

import { api } from "~/trpc/trpc-provider";

const DEFAULT_LIMIT = 20;

export function BiomarkerBrowserDebugClient() {
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const queryInput = useMemo(
    () => ({
      limit,
      search: search.trim() ? search.trim() : undefined,
    }),
    [limit, search],
  );

  const query = api.biomarker.list.useQuery(queryInput);

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
      <form className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-2 text-sm font-medium">
          Search
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            maxLength={100}
            placeholder="e.g. glucose"
            className="rounded-md border bg-background px-3 py-2 text-base"
          />
        </label>

        <label className="flex w-full max-w-xs flex-col gap-2 text-sm font-medium">
          Limit
          <input
            type="number"
            min={5}
            max={50}
            step={5}
            value={limit}
            onChange={(event) =>
              setLimit(
                Math.min(50, Math.max(5, Number(event.target.value) || DEFAULT_LIMIT)),
              )
            }
            className="rounded-md border bg-background px-3 py-2 text-base"
          />
        </label>
      </form>

      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading biomarkers…</p>
      ) : query.error ? (
        <p className="text-sm text-destructive">
          Failed to load biomarkers: {query.error.message}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {query.data?.items.length ?? 0} of {limit} requested
            </span>
            {query.isFetching && <span>Refreshing…</span>}
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y text-sm">
              <thead className="bg-muted/50 text-left font-semibold">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-background">
                {query.data?.items.length ? (
                  query.data.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 font-medium">{item.name}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {item.slug}
                      </td>
                      <td className="px-4 py-2">{item.category}</td>
                      <td className="px-4 py-2">{item.canonicalUnit}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-muted-foreground"
                    >
                      No biomarkers matched that search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
            {JSON.stringify(query.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
