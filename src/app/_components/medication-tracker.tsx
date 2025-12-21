"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

import { api } from "~/trpc/trpc-provider";
import { Button } from "@/shared/components/ui/button";
import { useAnalytics } from "@/features/analytics";

type MedicationFormState = {
  id?: string;
  name: string;
  dosage: string;
  frequency: string;
  timesText: string;
  startDate: string;
  endDate: string;
};

const emptyForm: MedicationFormState = {
  name: "",
  dosage: "",
  frequency: "",
  timesText: "",
  startDate: "",
  endDate: "",
};

function parseTimes(input: string): string[] {
  return input
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function formatDateInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "yyyy-MM-dd");
}

export function MedicationTracker() {
  const utils = api.useUtils();
  const { trackFeature } = useAnalytics();

  const [form, setForm] = useState<MedicationFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: medications,
    isLoading: medicationsLoading,
    isError: medicationsError,
  } = api.medication.list.useQuery();

  const {
    data: schedule,
    isLoading: scheduleLoading,
    isError: scheduleError,
  } = api.medication.getTodaySchedule.useQuery({});

  const { data: adherence } = api.medication.getAdherence.useQuery();

  const createMutation = api.medication.create.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.medication.list.invalidate(),
        utils.medication.getTodaySchedule.invalidate(),
        utils.medication.getAdherence.invalidate(),
      ]);
      setForm(emptyForm);
      setFormError(null);
      // Track medication creation (count only, no medication name/details)
      trackFeature("medications", "create");
    },
    onError: (err) => {
      setFormError(err.message || "Failed to save medication.");
    },
  });

  const updateMutation = api.medication.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.medication.list.invalidate(),
        utils.medication.getTodaySchedule.invalidate(),
        utils.medication.getAdherence.invalidate(),
      ]);
      setForm(emptyForm);
      setFormError(null);
    },
    onError: (err) => {
      setFormError(err.message || "Failed to update medication.");
    },
  });

  const deleteMutation = api.medication.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.medication.list.invalidate(),
        utils.medication.getTodaySchedule.invalidate(),
        utils.medication.getAdherence.invalidate(),
      ]);
    },
  });

  const logTakenMutation = api.medication.logTaken.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.medication.getTodaySchedule.invalidate(),
        utils.medication.getAdherence.invalidate(),
      ]);
      // Track medication taken (count only, no medication details)
      trackFeature("medications", "taken");
    },
  });

  const logSkippedMutation = api.medication.logSkipped.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.medication.getTodaySchedule.invalidate(),
        utils.medication.getAdherence.invalidate(),
      ]);
      // Track medication skipped (count only)
      trackFeature("medications", "skipped");
    },
  });

  const snoozeMutation = api.medication.snooze.useMutation({
    onSuccess: async () => {
      await utils.medication.getTodaySchedule.invalidate();
    },
  });

  // Auto-refresh schedule every 60 seconds to update snooze expirations
  useEffect(() => {
    const interval = setInterval(() => {
      void utils.medication.getTodaySchedule.invalidate();
    }, 60000);
    return () => clearInterval(interval);
  }, [utils.medication.getTodaySchedule]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const sortedSchedule = useMemo(
    () => schedule ?? [],
    [schedule],
  );

  function handleEditMedication(id: string) {
    const medication = medications?.find((m) => m.id === id);
    if (!medication) return;

    setForm({
      id: medication.id,
      name: medication.name,
      dosage: medication.dosage ?? "",
      frequency: medication.frequency,
      timesText: medication.times.join(", "),
      startDate: formatDateInput(medication.startDate),
      endDate: formatDateInput(medication.endDate ?? null),
    });
    setFormError(null);
  }

  function handleDeleteMedication(id: string) {
    deleteMutation.mutate({ id });
  }

  function handleFormChange<K extends keyof MedicationFormState>(
    key: K,
    value: MedicationFormState[K],
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    try {
      const times = parseTimes(form.timesText);
      if (times.length === 0) {
        setFormError("Add at least one time (HH:MM).");
        return;
      }

      if (!form.startDate) {
        setFormError("Start date is required.");
        return;
      }

      const startDate = new Date(form.startDate);
      const endDate = form.endDate ? new Date(form.endDate) : undefined;

      if (Number.isNaN(startDate.getTime())) {
        setFormError("Invalid start date.");
        return;
      }

      if (endDate && Number.isNaN(endDate.getTime())) {
        setFormError("Invalid end date.");
        return;
      }

      const payload = {
        name: form.name.trim(),
        dosage: form.dosage.trim() || undefined,
        frequency: form.frequency.trim() || "Custom",
        times,
        startDate,
        endDate,
      };

      if (!payload.name) {
        setFormError("Medication name is required.");
        return;
      }

      if (form.id) {
        updateMutation.mutate({
          id: form.id,
          ...payload,
        });
      } else {
        createMutation.mutate(payload);
      }
    } catch (err) {
      console.error("[MedicationTracker] Failed to submit form", err);
      setFormError("Something went wrong while saving. Please try again.");
    }
  }

  function handleLogTaken(
    medicationId: string,
    time: string,
  ) {
    logTakenMutation.mutate({
      medicationId,
      time,
      date: new Date(),
      takenAt: new Date(),
    });
  }

  function handleLogSkipped(
    medicationId: string,
    time: string,
  ) {
    logSkippedMutation.mutate({
      medicationId,
      time,
      date: new Date(),
    });
  }

  function handleSnooze(
    medicationId: string,
    time: string,
    minutes: number,
  ) {
    snoozeMutation.mutate({
      medicationId,
      time,
      date: new Date(),
      minutes,
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      {/* Daily schedule */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Today&apos;s Schedule
            </h2>
            <p className="text-xs text-muted-foreground">
              Track whether you took meds at the scheduled time or at
              least today.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {format(new Date(), "MMM d, yyyy")}
          </span>
        </div>

        {/* Adherence Summary */}
        {adherence && (adherence.weekly.total > 0 || adherence.allTime.total > 0) && (
          <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">This Week</p>
              <p className={`text-lg font-bold ${
                adherence.weekly.percentage >= 80
                  ? "text-green-600"
                  : adherence.weekly.percentage >= 50
                    ? "text-amber-600"
                    : "text-red-600"
              }`}>
                {adherence.weekly.percentage}%
              </p>
              <p className="text-xs text-muted-foreground">
                {adherence.weekly.taken}/{adherence.weekly.total} doses
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">All Time</p>
              <p className={`text-lg font-bold ${
                adherence.allTime.percentage >= 80
                  ? "text-green-600"
                  : adherence.allTime.percentage >= 50
                    ? "text-amber-600"
                    : "text-red-600"
              }`}>
                {adherence.allTime.percentage}%
              </p>
              <p className="text-xs text-muted-foreground">
                {adherence.allTime.taken}/{adherence.allTime.total} doses
              </p>
            </div>
          </div>
        )}

        {scheduleLoading && (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            Loading schedule...
          </div>
        )}

        {scheduleError && !scheduleLoading && (
          <div className="flex h-32 items-center justify-center text-sm text-destructive">
            Failed to load today&apos;s schedule.
          </div>
        )}

        {!scheduleLoading &&
          !scheduleError &&
          sortedSchedule.length === 0 && (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No medications scheduled for today yet.
            </div>
          )}

        {!scheduleLoading &&
          !scheduleError &&
          sortedSchedule.length > 0 && (
            <div className="space-y-3">
              {sortedSchedule.map((item) => {
                const isTaken = item.status === "taken";
                const isSkipped = item.status === "skipped";
                const isSnoozed = item.status === "snoozed";
                const isPending = item.status === "pending";

                return (
                  <div
                    key={`${item.medicationId}-${item.time}`}
                    className="flex items-center justify-between rounded-lg border bg-background p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={[
                          "flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-semibold",
                          isTaken
                            ? "border-green-600 bg-green-50 text-green-700"
                            : isSkipped
                              ? "border-destructive bg-destructive/10 text-destructive"
                              : isSnoozed
                                ? "border-amber-500 bg-amber-50 text-amber-700"
                                : "border-muted-foreground/50 text-muted-foreground",
                        ].join(" ")}
                      >
                        {item.time}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {item.medicationName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.dosage
                            ? `${item.dosage} • `
                            : null}
                          {isTaken &&
                            (item.takenAt
                              ? `Taken at ${format(item.takenAt, "HH:mm")}`
                              : "Taken")}
                          {isSkipped && "Skipped"}
                          {isSnoozed &&
                            item.snoozedUntil &&
                            `Snoozed until ${format(item.snoozedUntil, "HH:mm")}`}
                          {isPending &&
                            `Scheduled for ${item.time}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {isPending && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            disabled={logTakenMutation.isPending || logSkippedMutation.isPending || snoozeMutation.isPending}
                            onClick={() =>
                              handleLogTaken(
                                item.medicationId,
                                item.time,
                              )
                            }
                          >
                            Take
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={logTakenMutation.isPending || logSkippedMutation.isPending || snoozeMutation.isPending}
                            onClick={() =>
                              handleLogSkipped(
                                item.medicationId,
                                item.time,
                              )
                            }
                          >
                            Skip
                          </Button>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Snooze:</span>
                            {[10, 30, 60].map((mins) => (
                              <Button
                                key={mins}
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs"
                                disabled={snoozeMutation.isPending || logTakenMutation.isPending}
                                onClick={() =>
                                  handleSnooze(
                                    item.medicationId,
                                    item.time,
                                    mins,
                                  )
                                }
                              >
                                {mins}m
                              </Button>
                            ))}
                          </div>
                        </>
                      )}
                      {isSnoozed && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            disabled={logTakenMutation.isPending}
                            onClick={() =>
                              handleLogTaken(
                                item.medicationId,
                                item.time,
                              )
                            }
                          >
                            Take now
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-500 text-amber-700"
                            disabled={logSkippedMutation.isPending}
                            onClick={() =>
                              handleLogSkipped(
                                item.medicationId,
                                item.time,
                              )
                            }
                          >
                            Skip
                          </Button>
                        </>
                      )}
                      {isTaken && (
                        <Button size="sm" variant="outline" disabled>
                          Taken
                        </Button>
                      )}
                      {isSkipped && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive text-destructive"
                          disabled={logTakenMutation.isPending}
                          onClick={() =>
                            handleLogTaken(
                              item.medicationId,
                              item.time,
                            )
                          }
                        >
                          Undo skip
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>

      {/* Manage medications */}
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Manage Medications</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Simple desktop-focused CRUD. Times are stored as daily
            HH:MM slots.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Name
              </label>
              <input
                type="text"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.name}
                onChange={(event) =>
                  handleFormChange("name", event.target.value)
                }
                placeholder="Metformin"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Dosage
              </label>
              <input
                type="text"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.dosage}
                onChange={(event) =>
                  handleFormChange("dosage", event.target.value)
                }
                placeholder="500 mg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Frequency
              </label>
              <input
                type="text"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.frequency}
                onChange={(event) =>
                  handleFormChange(
                    "frequency",
                    event.target.value,
                  )
                }
                placeholder="Twice daily"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Times (HH:MM, comma separated)
              </label>
              <input
                type="text"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.timesText}
                onChange={(event) =>
                  handleFormChange(
                    "timesText",
                    event.target.value,
                  )
                }
                placeholder="08:00, 20:00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Start date
              </label>
              <input
                type="date"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.startDate}
                onChange={(event) =>
                  handleFormChange(
                    "startDate",
                    event.target.value,
                  )
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                End date (optional)
              </label>
              <input
                type="date"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.endDate}
                onChange={(event) =>
                  handleFormChange(
                    "endDate",
                    event.target.value,
                  )
                }
              />
            </div>
          </div>

          {formError && (
            <p className="text-xs text-destructive">{formError}</p>
          )}

          <div className="flex items-center justify-between gap-2">
            <Button type="submit" size="sm" disabled={isSaving}>
              {form.id
                ? isSaving
                  ? "Saving changes..."
                  : "Save changes"
                : isSaving
                  ? "Adding..."
                  : "Add medication"}
            </Button>
            {form.id && (
              <button
                type="button"
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                onClick={() => {
                  setForm(emptyForm);
                  setFormError(null);
                }}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>

        <div className="mt-4 space-y-2 border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground">
            Active medications
          </p>

          {medicationsLoading && (
            <p className="text-xs text-muted-foreground">
              Loading medications...
            </p>
          )}

          {medicationsError && !medicationsLoading && (
            <p className="text-xs text-destructive">
              Failed to load medications.
            </p>
          )}

          {!medicationsLoading &&
            !medicationsError &&
            (!medications || medications.length === 0) && (
              <p className="text-xs text-muted-foreground">
                No medications added yet.
              </p>
            )}

          {!medicationsLoading &&
            !medicationsError &&
            medications &&
            medications.length > 0 && (
              <div className="space-y-2">
                {medications.map((medication) => (
                  <div
                    key={medication.id}
                    className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-xs"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">
                        {medication.name}
                      </span>
                      <span className="text-muted-foreground">
                        {[
                          medication.dosage,
                          medication.frequency,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </span>
                      <span className="text-muted-foreground">
                        {medication.times.join(", ")}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-md border bg-background px-2 py-1 text-xs font-medium hover:bg-muted"
                        onClick={() =>
                          handleEditMedication(medication.id)
                        }
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-destructive bg-background px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                        onClick={() =>
                          handleDeleteMedication(medication.id)
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default MedicationTracker;

