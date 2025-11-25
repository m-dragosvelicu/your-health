import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "@/shared/server/api/trpc";
import {
  listMeasurementsInputSchema,
  getMeasurementInputSchema,
  createMeasurementInputSchema,
  updateMeasurementInputSchema,
} from "@/shared/server/api/schemas/measurements";

export const measurementRouter = createTRPCRouter({
  list: protectedProcedure
    .input(listMeasurementsInputSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { biomarkerId, category, flag, dateFrom, dateTo, limit, cursor } =
        input;

      const where: Prisma.MeasurementWhereInput = {
        userId,
        deletedAt: null,
      };

      if (biomarkerId) where.biomarkerId = biomarkerId;
      if (flag) where.flag = flag;
      if (category) {
        // join through biomarker category
        where.biomarker = { category };
      }
      if (dateFrom || dateTo) {
        where.measuredAt = {};
        if (dateFrom) where.measuredAt.gte = dateFrom;
        if (dateTo) where.measuredAt.lte = dateTo;
      }

      const items = await ctx.db.measurement.findMany({
        where,
        orderBy: [{ measuredAt: "desc" }, { createdAt: "desc" }, { id: "asc" }],
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          biomarker: true,
          labReport: true,
        },
      });

      let nextCursor: string | null = null;
      if (items.length > limit) {
        const last = items.pop()!;
        nextCursor = last.id;
      }

      return { items, nextCursor };
    }),

  get: protectedProcedure
    .input(getMeasurementInputSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id } = input;

      const m = await ctx.db.measurement.findFirst({
        where: { id, userId, deletedAt: null },
        include: { biomarker: true, labReport: true },
      });

      if (!m) throw new TRPCError({ code: "NOT_FOUND" });

      return m;
    }),

  create: protectedProcedure
    .input(createMeasurementInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { measuredAt, ...rest } = input;

      const created = await ctx.db.measurement.create({
        data: {
          userId,
          measuredAt: measuredAt ?? new Date(),
          ...rest,
        },
      });

      return created;
    }),

  update: protectedProcedure
    .input(updateMeasurementInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id, ...data } = input;

      const existing = await ctx.db.measurement.findFirst({
        where: { id, userId, deletedAt: null },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await ctx.db.measurement.update({
        where: { id },
        data,
      });

      return updated;
    }),

  delete: protectedProcedure
    .input(getMeasurementInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id } = input;

      const existing = await ctx.db.measurement.findFirst({
        where: { id, userId, deletedAt: null },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.measurement.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return { success: true };
    }),
});
