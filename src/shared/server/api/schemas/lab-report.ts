import { z } from "zod";
import { LabReportStatus } from "@prisma/client";

// For listing lab reports (current user)
export const listLabReportsInputSchema = z.object({
  status: z.nativeEnum(LabReportStatus).optional(),
  dateFrom: z.coerce.date().optional(), // from OpenAPI dateFrom
  dateTo: z.coerce.date().optional(),   // and dateTo
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().nullish(),
});

// For GET /lab-reports/{id}
export const getLabReportInputSchema = z.object({
  id: z.string().min(1),
});

// For creating a “metadata only” lab report (no file)
export const createLabReportInputSchema = z.object({
  title: z.string().max(160).optional(),
  providerName: z.string().max(120).optional(),
  accessionNumber: z.string().max(50).optional(),
  orderId: z.string().max(50).optional(),
  collectedAt: z.coerce.date().optional(),
  receivedAt: z.coerce.date().optional(),
});

// For updating existing lab reports
export const updateLabReportInputSchema = createLabReportInputSchema.partial().extend({
  id: z.string().min(1),
});
