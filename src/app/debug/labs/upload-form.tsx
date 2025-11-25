"use client";

import { useState } from "react";

export function UploadForm() {
  const [status, setStatus] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [providerName, setProviderName] = useState<string>("");
  const [collectedAt, setCollectedAt] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setStatus("Please choose a file");
      return;
    }
    setIsSubmitting(true);
    setStatus("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (title) formData.append("title", title);
      if (providerName) formData.append("providerName", providerName);
      if (collectedAt) formData.append("collectedAt", collectedAt);

      const res = await fetch("/api/uploads/lab-report", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Upload failed (${res.status})`);
      }

      const json = (await res.json()) as {
        labReport: { id: string };
        storageObject: { key: string | null };
      };
      setStatus(
        `Created lab report ${json.labReport.id} with file ${json.storageObject.key ?? "unknown"}`,
      );
      setTitle("");
      setProviderName("");
      setCollectedAt("");
      setFile(null);
    } catch (err) {
      console.error(err);
      setStatus((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Upload Lab Report (pending)</h2>
      <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          File (PDF/JPG/PNG)
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="rounded border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded border bg-background px-3 py-2 text-sm"
            placeholder="Annual Checkup"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Provider
          <input
            value={providerName}
            onChange={(e) => setProviderName(e.target.value)}
            className="rounded border bg-background px-3 py-2 text-sm"
            placeholder="Quest / LabCorp"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Collected At
          <input
            type="datetime-local"
            value={collectedAt}
            onChange={(e) => setCollectedAt(e.target.value)}
            className="rounded border bg-background px-3 py-2 text-sm"
          />
        </label>
        <div className="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {isSubmitting ? "Uploading…" : "Upload"}
          </button>
          {status && <p className="text-sm text-muted-foreground">{status}</p>}
        </div>
      </form>
    </div>
  );
}
