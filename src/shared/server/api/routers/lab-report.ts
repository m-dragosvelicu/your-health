import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "@/shared/server/api/trpc";
import {
  listLabReportsInputSchema,
  getLabReportInputSchema,
  createLabReportInputSchema,
  updateLabReportInputSchema,
} from "@/shared/server/api/schemas/lab-report";

export const labReportRouter = createTRPCRouter({
  list: protectedProcedure
    .input(listLabReportsInputSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { status, dateFrom, dateTo, limit, cursor } = input;

      const where: Prisma.LabReportWhereInput = {
        userId,
        deletedAt: null,
      };

      if (status) where.status = status;
      if (dateFrom || dateTo) {
        where.collectedAt = {};
        if (dateFrom) where.collectedAt.gte = dateFrom;
        if (dateTo) where.collectedAt.lte = dateTo;
      }

      const items = await ctx.db.labReport.findMany({
        where,
        orderBy: [{ collectedAt: "desc" }, { createdAt: "desc" }, { id: "asc" }],
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      let nextCursor: string | null = null;
      if (items.length > limit) {
        const last = items.pop()!;
        nextCursor = last.id;
      }

      return { items, nextCursor };
    }),

  get: protectedProcedure
    .input(getLabReportInputSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id } = input;

      const report = await ctx.db.labReport.findFirst({
        where: { id, userId, deletedAt: null },
        include: {
          _count: { select: { measurements: true } },
        },
      });

      if (!report) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return report;
    }),

  create: protectedProcedure
    .input(createLabReportInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const created = await ctx.db.labReport.create({
        data: {
          userId,
          ...input,
          // status defaults in Prisma (e.g. PENDING or READY),
        },
      });

      return created;
    }),

  update: protectedProcedure
    .input(updateLabReportInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id, ...data } = input;

      const existing = await ctx.db.labReport.findFirst({
        where: { id, userId, deletedAt: null },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const updated = await ctx.db.labReport.update({
        where: { id },
        data,
      });

      return updated;
    }),

  delete: protectedProcedure
    .input(getLabReportInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id } = input;

      const existing = await ctx.db.labReport.findFirst({
        where: { id, userId, deletedAt: null },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.db.labReport.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return { success: true };
    }),
});
