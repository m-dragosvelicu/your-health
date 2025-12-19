"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useRef, useState } from "react";

type LabPatient = {
  last_name: string;
  first_name: string;
  birthdate: string | null;
};

type LabMeta = {
  provider: string;
  sampling_date: string;
  result_date: string;
  raw_file_path: string | null;
};

type LabTest = {
  section: string;
  name: string;
  value: number | null;
  rawValue: string;
  unit: string;
  refRaw: string;
};

type UploadedLab = {
  patient: LabPatient;
  meta: LabMeta;
  tests: LabTest[];
  rejectedLines: string[];
};

type UploadResponse = {
  ok: boolean;
  preview: UploadedLab;
};

type ConfirmResponse = {
  ok: boolean;
  labId: string;
};

export default function LabsImportPanel() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<UploadedLab | null>(null);
  const [labId, setLabId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setPreview(null);
    setLabId(null);
    setError(null);
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleConfirm = async () => {
    if (!preview) {
      setError("No preview data to confirm.");
      return;
    }

    setIsConfirming(true);
    setError(null);

    try {
      const response = await fetch("/api/labs/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          patient: {
            lastName: preview.patient.last_name,
            firstName: preview.patient.first_name,
            birthdate: preview.patient.birthdate,
          },
          meta: {
            provider: preview.meta.provider,
            samplingDate: preview.meta.sampling_date,
            resultDate: preview.meta.result_date,
            rawFilePath: preview.meta.raw_file_path,
          },
          tests: preview.tests,
        }),
      });

      if (!response.ok) {
        throw new Error(`Confirm failed with status ${response.status}`);
      }

      const data = (await response.json()) as ConfirmResponse;

      if (!data.ok) {
        throw new Error("Confirm response did not indicate success");
      }

      setLabId(data.labId);
      setSuccess(true);
    } catch (err) {
      console.error("[LabsImportPanel] Failed to confirm labs", err);
      setError("Failed to save lab results. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFile) {
      setError("Please choose a lab report file to continue.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/labs/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const data = (await response.json()) as UploadResponse;

      if (!data.ok) {
        throw new Error("Upload response did not indicate success");
      }

      setPreview(data.preview);
      setSuccess(false);
    } catch (err) {
      console.error("[LabsImportPanel] Failed to preview labs", err);
      setError(
        "We couldn't preview this lab report. The import API might not be ready yet, or the file format is unsupported.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const groupedBySection: Record<string, LabTest[]> | null =
    preview?.tests?.length
      ? preview.tests.reduce<Record<string, LabTest[]>>((acc, test) => {
          if (!acc[test.section]) {
            acc[test.section] = [];
          }
          acc[test.section]!.push(test);
          return acc;
        }, {})
      : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col justify-between rounded-lg border bg-card p-6 shadow-sm"
      >
        <div>
          <h2 className="text-lg font-semibold">Upload lab report</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload your lab report PDF from any provider. Our AI will extract the values and show a
            preview before anything is saved.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 p-8">
            <svg
              className="mb-3 h-12 w-12 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mb-1 text-sm font-medium">
              {selectedFile ? selectedFile.name : "Drop a file or choose from your device"}
            </p>
            <p className="mb-4 text-xs text-muted-foreground">PDF or image (up to 3 pages)</p>
            <button
              type="button"
              onClick={handlePickFile}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Choose file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>We only parse the file for preview until you confirm.</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Original file will be stored for provenance once you import.</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              You can always review and confirm the parsed values before saving.
            </p>
          )}
          <button
            type="submit"
            disabled={isUploading}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {isUploading ? "Parsing..." : "Preview import"}
          </button>
        </div>
      </form>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Preview import</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Once parsing succeeds, you&apos;ll see the patient details and lab values that will be
          associated with this lab session.
        </p>

        {!preview && (
          <div className="mt-6 rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
            <p>No preview yet.</p>
            <p className="mt-1">
              Upload your lab report PDF and click{" "}
              <span className="font-medium text-foreground">Preview import</span> to see the
              AI-extracted values here. Works with any lab provider!
            </p>
          </div>
        )}

        {preview && (
          <div className="mt-6 space-y-6">
            <div className="rounded-lg border bg-background p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Patient</p>
              <p className="mt-1 text-sm font-medium">
                {preview.patient.first_name} {preview.patient.last_name}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Birthdate:{" "}
                <span className="font-medium text-foreground">{preview.patient.birthdate}</span>
              </p>
            </div>

            <div className="rounded-lg border bg-background p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Session</p>
              <dl className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                <div className="space-y-0.5">
                  <dt className="text-muted-foreground">Provider</dt>
                  <dd className="font-medium text-foreground">{preview.meta.provider}</dd>
                </div>
                <div className="space-y-0.5">
                  <dt className="text-muted-foreground">Sampling date</dt>
                  <dd className="font-medium text-foreground">{preview.meta.sampling_date}</dd>
                </div>
                <div className="space-y-0.5">
                  <dt className="text-muted-foreground">Result date</dt>
                  <dd className="font-medium text-foreground">{preview.meta.result_date}</dd>
                </div>
                {preview.meta.raw_file_path && (
                  <div className="space-y-0.5">
                    <dt className="text-muted-foreground">Source file</dt>
                    <dd className="font-medium text-foreground">
                      <a
                        href={preview.meta.raw_file_path}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline hover:no-underline"
                      >
                        Download PDF
                      </a>
                    </dd>
                  </div>
                )}
                {labId && (
                  <div className="space-y-0.5">
                    <dt className="text-muted-foreground">Lab ID</dt>
                    <dd className="font-mono text-[0.7rem] text-foreground">{labId}</dd>
                  </div>
                )}
              </dl>
            </div>

            {groupedBySection && (
              <div className="space-y-4">
                {Object.entries(groupedBySection).map(([section, tests]) => (
                  <div key={section} className="rounded-lg border bg-background p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold">{section}</p>
                      <p className="text-xs text-muted-foreground">
                        {tests.length}{" "}
                        {tests.length === 1 ? "measurement will be imported" : "measurements will be imported"}
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
                            <tr key={`${section}-${test.name}-${test.rawValue}`}>
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
                                {test.unit}
                              </td>
                              <td className="py-2 align-top text-xs text-muted-foreground">
                                {test.refRaw}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Confirm & Save Button */}
            {!success && (
              <div className="mt-6 rounded-lg border bg-muted/10 p-4">
                <button
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {isConfirming ? "Saving..." : "✓ Confirm & Save to Dashboard"}
                </button>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  This will save {preview.tests.length} test results to your dashboard
                </p>
              </div>
            )}

            {/* Success Message */}
            {success && labId && (
              <div className="mt-6 rounded-lg border border-green-600 bg-green-50 p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-semibold">Lab results saved successfully!</p>
                </div>
                <p className="mt-2 text-sm text-green-700">
                  Lab ID: <code className="rounded bg-green-100 px-1 py-0.5 font-mono text-xs">{labId}</code>
                </p>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                    setLabId(null);
                    setSuccess(false);
                  }}
                  className="mt-3 text-sm text-green-700 underline hover:no-underline"
                >
                  Import another report
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
