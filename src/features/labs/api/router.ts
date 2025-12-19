import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@/shared/server/api/trpc";

/**
 * tRPC router for reading lab data.
 *
 * Upload/parsing is handled via the REST endpoint under /api/labs/upload.
 */
export const labRouter = createTRPCRouter({
  /**
   * List lab sessions for the current user.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const { db, session } = ctx;

    const labs = await db.lab.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [
        { sampledAt: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        provider: true,
        sampledAt: true,
        resultAt: true,
        createdAt: true,
        patientFirstName: true,
        patientLastName: true,
        _count: {
          select: { tests: true },
        },
      },
    });

    return labs.map((lab) => ({
      id: lab.id,
      provider: lab.provider,
      sampledAt: lab.sampledAt,
      resultAt: lab.resultAt,
      createdAt: lab.createdAt,
      patient: {
        firstName: lab.patientFirstName,
        lastName: lab.patientLastName,
      },
      testsCount: lab._count.tests,
    }));
  }),

  /**
   * Fetch a single lab with all parsed tests.
   */
  byId: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { db, session } = ctx;

      const lab = await db.lab.findFirst({
        where: {
          id: input.id,
          userId: session.user.id,
        },
        include: {
          tests: {
            orderBy: [{ section: "asc" }, { name: "asc" }],
          },
        },
      });

      if (!lab) {
        return null;
      }

      return {
        id: lab.id,
        provider: lab.provider,
        sampledAt: lab.sampledAt,
        resultAt: lab.resultAt,
        createdAt: lab.createdAt,
        patient: {
          firstName: lab.patientFirstName,
          lastName: lab.patientLastName,
          birthdate: lab.patientBirthdate,
        },
        tests: lab.tests.map((test) => ({
          id: test.id,
          section: test.section,
          name: test.name,
          value: test.value,
          rawValue: test.rawValue,
          unit: test.unit,
          refRaw: test.refRaw,
        })),
      };
    }),

  /**
   * Delete a lab (and its tests) owned by the current user.
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;

      const existing = await db.lab.findFirst({
        where: {
          id: input.id,
          userId: session.user.id,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lab not found",
        });
      }

      await db.lab.delete({
        where: { id: input.id },
      });

      return { ok: true };
    }),
});
