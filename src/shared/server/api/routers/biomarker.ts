/**
 * STUB: Biomarker router - future work
 *
 * This router provides CRUD for a biomarker reference catalog, but the catalog
 * is NOT currently linked to LabTest results. To provide value, needs:
 * 1. Alias/mapping system to link parsed test names to canonical biomarkers
 * 2. Integration into PDF parsing pipeline
 * 3. Expanded catalog (currently only 13 biomarkers, real-world has hundreds)
 */

import { TRPCError } from "@trpc/server";
import { type Prisma } from "@prisma/client";

import { createTRPCRouter, protectedProcedure } from "@/shared/server/api/trpc";
import {
  listBiomarkersInputSchema,
  getBiomarkerInputSchema,
} from "@/shared/server/api/schemas/biomarker";

export const biomarkerRouter = createTRPCRouter({
  /**
   * GET /biomarkers
   * - Auth required (protectedProcedure)
   * - Filters: category (enum), search (name/slug)
   * - Pagination: cursor + limit, returns { items, nextCursor }
   */
  list: protectedProcedure
    .input(listBiomarkersInputSchema)
    .query(async ({ ctx, input }) => {
      const { category, search, limit, cursor } = input;

      const where: Prisma.BiomarkerWhereInput = {};

      if (category) {
        where.category = category;
      }

      if (search && search.trim() !== "") {
        const q = search.trim();
        where.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
        ];
      }

      const items = await ctx.db.biomarker.findMany({
        where,
        orderBy: [
          { sortOrder: "asc" },
          { name: "asc" },
          { id: "asc" },
        ],
        take: limit + 1, // fetch one extra to detect nextCursor
        cursor: cursor ? { id: cursor } : undefined,
      });

      let nextCursor: string | null = null;
      if (items.length > limit) {
        const last = items.pop()!;
        nextCursor = last.id;
      }

      return { items, nextCursor };
    }),

  /**
   * GET /biomarkers/{idOrSlug}
   * - Auth required (protectedProcedure, same security as list)
   * - idOrSlug: can be Prisma id OR slug
   */
  get: protectedProcedure
    .input(getBiomarkerInputSchema)
    .query(async ({ ctx, input }) => {
      const { idOrSlug } = input;

      const biomarker = await ctx.db.biomarker.findFirst({
        where: {
          OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        },
      });

      if (!biomarker) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return biomarker;
    }),
});
