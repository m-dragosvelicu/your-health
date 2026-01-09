import { z } from "zod";
import {
  BiomarkerCategory,
  MeasurementComparator,
  MeasurementFlag,
} from "@prisma/client";

export const listMeasurementsInputSchema = z.object({
  biomarkerId: z.string().optional(),
  category: z.nativeEnum(BiomarkerCategory).optional(),
  flag: z.nativeEnum(MeasurementFlag).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().nullish(),
});

// For GET /measurements/{id}
export const getMeasurementInputSchema = z.object({
  id: z.string().min(1),
});

// For POST /measurements (manual)
export const createMeasurementInputSchema = z.object({
  biomarkerId: z.string().min(1),
  labReportId: z.string().optional(),
  measuredAt: z.coerce.date().optional(), // default now if omitted
  // For MVP treat decimals as strings (Prisma will accept decimal string)
  value: z.string().optional(),
  comparator: z.nativeEnum(MeasurementComparator).optional(),
  unit: z.string().max(32),
  referenceLow: z.string().optional(),
  referenceHigh: z.string().optional(),
  referenceText: z.string().max(200).optional(),
  flag: z.nativeEnum(MeasurementFlag).optional(),
  note: z.string().max(1000).optional(),
});

// For PATCH /measurements/{id}
export const updateMeasurementInputSchema = createMeasurementInputSchema.partial().extend({
  id: z.string().min(1),
});
