import "server-only";

import { startOfDay, endOfDay } from "date-fns";
import type { MedicationLogStatus } from "@prisma/client";

import { db } from "@/shared/server/db";

export type MedicationInput = {
  name: string;
  dosage?: string | null;
  frequency: string;
  times: string[];
  startDate: Date;
  endDate?: Date | null;
};

export type MedicationScheduleItem = {
  medicationId: string;
  medicationName: string;
  dosage: string | null;
  frequency: string;
  time: string;
  scheduledAt: Date;
  logId?: string;
  status: "pending" | "taken" | "skipped" | "snoozed";
  takenAt?: Date | null;
  snoozedUntil?: Date | null;
};

export async function listMedications(userId: string) {
  return db.medication.findMany({
    where: {
      userId,
      isActive: true,
    },
    orderBy: [{ name: "asc" }],
  });
}

export async function createMedication(userId: string, input: MedicationInput) {
  const { name, dosage, frequency, times, startDate, endDate } = input;

  return db.medication.create({
    data: {
      userId,
      name,
      dosage: dosage ?? null,
      frequency,
      times,
      startDate,
      endDate: endDate ?? null,
    },
  });
}

export async function updateMedication(
  userId: string,
  medicationId: string,
  input: Partial<MedicationInput>,
) {
  const existing = await db.medication.findFirst({
    where: {
      id: medicationId,
      userId,
      isActive: true,
    },
  });

  if (!existing) {
    return null;
  }

  return db.medication.update({
    where: { id: medicationId },
    data: {
      name: input.name ?? existing.name,
      dosage:
        input.dosage !== undefined ? input.dosage : existing.dosage,
      frequency: input.frequency ?? existing.frequency,
      times: input.times ?? existing.times,
      startDate: input.startDate ?? existing.startDate,
      endDate:
        input.endDate !== undefined ? input.endDate : existing.endDate,
    },
  });
}

export async function softDeleteMedication(
  userId: string,
  medicationId: string,
) {
  const existing = await db.medication.findFirst({
    where: {
      id: medicationId,
      userId,
      isActive: true,
    },
  });

  if (!existing) {
    return null;
  }

  return db.medication.update({
    where: { id: medicationId },
    data: {
      isActive: false,
    },
  });
}

function buildScheduledDate(date: Date, time: string) {
  const [hourPart, minutePart] = time.split(":");
  const hours = Number.parseInt(hourPart ?? "0", 10);
  const minutes = Number.parseInt(minutePart ?? "0", 10);

  const scheduled = new Date(date);
  scheduled.setHours(hours, minutes, 0, 0);
  return scheduled;
}

function mapStatus(
  status: MedicationLogStatus,
  snoozedUntil: Date | null,
): "taken" | "skipped" | "snoozed" | "pending" {
  // If snoozed and snooze hasn't expired yet
  if (snoozedUntil && snoozedUntil > new Date()) {
    return "snoozed";
  }
  // If snooze expired, treat as pending again
  if (snoozedUntil && snoozedUntil <= new Date() && status !== "TAKEN") {
    return "pending";
  }
  if (status === "TAKEN") return "taken";
  return "skipped";
}

export async function logMedicationTaken(
  userId: string,
  medicationId: string,
  date: Date,
  time: string,
  takenAt?: Date,
) {
  const medication = await db.medication.findFirst({
    where: {
      id: medicationId,
      userId,
      isActive: true,
    },
  });

  if (!medication) {
    return null;
  }

  const scheduledAt = buildScheduledDate(date, time);
  const effectiveTakenAt = takenAt ?? new Date();

  const existing = await db.medicationLog.findFirst({
    where: {
      medicationId,
      scheduledAt,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (existing) {
    return db.medicationLog.update({
      where: { id: existing.id },
      data: {
        status: "TAKEN",
        takenAt: effectiveTakenAt,
      },
    });
  }

  return db.medicationLog.create({
    data: {
      medicationId,
      scheduledAt,
      takenAt: effectiveTakenAt,
      status: "TAKEN",
    },
  });
}

export async function logMedicationSkipped(
  userId: string,
  medicationId: string,
  date: Date,
  time: string,
) {
  const medication = await db.medication.findFirst({
    where: {
      id: medicationId,
      userId,
      isActive: true,
    },
  });

  if (!medication) {
    return null;
  }

  const scheduledAt = buildScheduledDate(date, time);

  const existing = await db.medicationLog.findFirst({
    where: {
      medicationId,
      scheduledAt,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (existing) {
    return db.medicationLog.update({
      where: { id: existing.id },
      data: {
        status: "SKIPPED",
        takenAt: null,
      },
    });
  }

  return db.medicationLog.create({
    data: {
      medicationId,
      scheduledAt,
      takenAt: null,
      status: "SKIPPED",
    },
  });
}

export async function snoozeMedication(
  userId: string,
  medicationId: string,
  date: Date,
  time: string,
  minutes: number,
) {
  const medication = await db.medication.findFirst({
    where: {
      id: medicationId,
      userId,
      isActive: true,
    },
  });

  if (!medication) {
    return null;
  }

  const scheduledAt = buildScheduledDate(date, time);
  const snoozedUntil = new Date();
  snoozedUntil.setMinutes(snoozedUntil.getMinutes() + minutes);

  const existing = await db.medicationLog.findFirst({
    where: {
      medicationId,
      scheduledAt,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (existing) {
    return db.medicationLog.update({
      where: { id: existing.id },
      data: {
        snoozedUntil,
        // Don't change status - keep it as is until taken or skipped
      },
    });
  }

  return db.medicationLog.create({
    data: {
      medicationId,
      scheduledAt,
      takenAt: null,
      status: "SKIPPED", // Temporary status, will show as snoozed due to snoozedUntil
      snoozedUntil,
    },
  });
}

export async function getTodaySchedule(
  userId: string,
  date: Date,
): Promise<MedicationScheduleItem[]> {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const [medications, logs] = await Promise.all([
    db.medication.findMany({
      where: {
        userId,
        isActive: true,
        startDate: { lte: dayEnd },
        OR: [
          { endDate: null },
          { endDate: { gte: dayStart } },
        ],
      },
      orderBy: [{ name: "asc" }],
    }),
    db.medicationLog.findMany({
      where: {
        medication: {
          userId,
        },
        scheduledAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      orderBy: [{ scheduledAt: "asc" }],
    }),
  ]);

  const schedule: MedicationScheduleItem[] = [];

  for (const medication of medications) {
    for (const time of medication.times) {
      const scheduledAt = buildScheduledDate(date, time);

      const log = logs.find(
        (entry) =>
          entry.medicationId === medication.id &&
          entry.scheduledAt.getTime() === scheduledAt.getTime(),
      );

      if (!log) {
        schedule.push({
          medicationId: medication.id,
          medicationName: medication.name,
          dosage: medication.dosage ?? null,
          frequency: medication.frequency,
          time,
          scheduledAt,
          status: "pending",
        });
        continue;
      }

      schedule.push({
        medicationId: medication.id,
        medicationName: medication.name,
        dosage: medication.dosage ?? null,
        frequency: medication.frequency,
        time,
        scheduledAt,
        logId: log.id,
        status: mapStatus(log.status, log.snoozedUntil),
        takenAt: log.takenAt,
        snoozedUntil: log.snoozedUntil,
      });
    }
  }

  schedule.sort(
    (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime(),
  );

  return schedule;
}

export type AdherenceStats = {
  weekly: {
    taken: number;
    total: number;
    percentage: number;
  };
  allTime: {
    taken: number;
    total: number;
    percentage: number;
  };
};

export async function getAdherence(userId: string): Promise<AdherenceStats> {
  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  // Get all active medications for this user
  const medications = await db.medication.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
      logs: true,
    },
  });

  let weeklyTaken = 0;
  let weeklyTotal = 0;
  let allTimeTaken = 0;
  let allTimeTotal = 0;

  for (const medication of medications) {
    const startDate = medication.startDate;
    const endDate = medication.endDate ?? now;
    const timesPerDay = medication.times.length;

    // Calculate all-time expected doses
    const daysSinceStart = Math.max(
      0,
      Math.ceil((Math.min(now.getTime(), endDate.getTime()) - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const allTimeExpected = daysSinceStart * timesPerDay;
    allTimeTotal += allTimeExpected;

    // Calculate weekly expected doses
    const weekStart = weekAgo > startDate ? weekAgo : startDate;
    const weekEnd = endDate < now ? endDate : now;
    if (weekEnd > weekStart) {
      const daysInWeek = Math.ceil((weekEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
      weeklyTotal += daysInWeek * timesPerDay;
    }

    // Count taken logs
    for (const log of medication.logs) {
      if (log.status === "TAKEN") {
        allTimeTaken++;
        if (log.scheduledAt >= weekAgo) {
          weeklyTaken++;
        }
      }
    }
  }

  const weeklyPercentage = weeklyTotal > 0 ? Math.round((weeklyTaken / weeklyTotal) * 100) : 0;
  const allTimePercentage = allTimeTotal > 0 ? Math.round((allTimeTaken / allTimeTotal) * 100) : 0;

  return {
    weekly: {
      taken: weeklyTaken,
      total: weeklyTotal,
      percentage: weeklyPercentage,
    },
    allTime: {
      taken: allTimeTaken,
      total: allTimeTotal,
      percentage: allTimePercentage,
    },
  };
}

