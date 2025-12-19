import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@/shared/server/api/trpc";
import {
  createMedication,
  getTodaySchedule,
  listMedications,
  logMedicationTaken,
  softDeleteMedication,
  updateMedication,
} from "../lib/medication-crud";

const timeStringSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format");

const medicationBaseSchema = z.object({
  name: z.string().min(1).max(100),
  dosage: z.string().min(1).max(100).optional(),
  frequency: z.string().min(1).max(100),
  times: z.array(timeStringSchema).min(1),
  startDate: z.date(),
  endDate: z.date().optional(),
});

export const medicationRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { session } = ctx;
    return listMedications(session.user.id);
  }),

  create: protectedProcedure
    .input(medicationBaseSchema)
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;
      return createMedication(session.user.id, input);
    }),

  update: protectedProcedure
    .input(
      medicationBaseSchema
        .partial()
        .extend({ id: z.string().min(1) }),
    )
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;
      const { id, ...data } = input;

      const updated = await updateMedication(
        session.user.id,
        id,
        data,
      );

      return updated;
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;
      const deleted = await softDeleteMedication(
        session.user.id,
        input.id,
      );

      return deleted;
    }),

  logTaken: protectedProcedure
    .input(
      z.object({
        medicationId: z.string().min(1),
        time: timeStringSchema,
        date: z.date().optional(),
        takenAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;

      const logged = await logMedicationTaken(
        session.user.id,
        input.medicationId,
        input.date ?? new Date(),
        input.time,
        input.takenAt,
      );

      return logged;
    }),

  getTodaySchedule: protectedProcedure
    .input(
      z
        .object({
          date: z.date().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { session } = ctx;
      const date = input?.date ?? new Date();

      return getTodaySchedule(session.user.id, date);
    }),
});

