"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";

import { api, type RouterOutputs } from "~/trpc/trpc-provider";

type LabListItem = RouterOutputs["lab"]["list"][number];

type LabsListProps = {
  labs: LabListItem[];
};

export function LabsList({ labs }: LabsListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteMutation = api.lab.delete.useMutation({
    onSuccess: () => {
      router.refresh();
    },
  });

  const handleDelete = async (labId: string) => {
    const confirmed = window.confirm(
      "Delete this lab and all its test results? This cannot be undone.",
    );
    if (!confirmed) return;

    setDeletingId(labId);
    try {
      await deleteMutation.mutateAsync({ id: labId });
    } catch (error) {
      console.error("[LabsList] Failed to delete lab", error);
      window.alert("Failed to delete lab. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (labs.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground shadow-sm">
        <p className="font-medium text-foreground">No labs imported yet</p>
        <p className="mt-1">
          When you upload a lab report, it will appear here with provider, dates, and test counts.
        </p>
        <div className="mt-4">
          <Link
            href="/dashboard/labs/import"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Import your first lab
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Patient</th>
            <th className="px-4 py-3">Provider</th>
            <th className="px-4 py-3">Sampled</th>
            <th className="px-4 py-3">Result</th>
            <th className="px-4 py-3">Tests</th>
            <th className="px-4 py-3">Imported</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y text-sm">
          {labs.map((lab) => (
            <tr key={lab.id} className="hover:bg-muted/40">
              <td className="px-4 py-3 align-top">
                <Link
                  href={`/dashboard/labs/${lab.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {lab.patient.firstName ?? "Unknown"} {lab.patient.lastName ?? ""}
                </Link>
              </td>
              <td className="px-4 py-3 align-top">
                <div className="text-foreground">{lab.provider}</div>
              </td>
              <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                {lab.sampledAt ? format(new Date(lab.sampledAt), "MMM d, yyyy") : "—"}
              </td>
              <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                {lab.resultAt ? format(new Date(lab.resultAt), "MMM d, yyyy") : "—"}
              </td>
              <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                {lab.testsCount}
              </td>
              <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                {format(new Date(lab.createdAt), "MMM d, yyyy HH:mm")}
              </td>
              <td className="px-4 py-3 align-top text-right">
                <button
                  type="button"
                  onClick={() => handleDelete(lab.id)}
                  disabled={deletingId === lab.id || deleteMutation.isPending}
                  className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
                >
                  {deletingId === lab.id ? "Deleting..." : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
