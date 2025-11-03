import { z } from "zod";
import bcrypt from "bcryptjs";
import { createTRPCRouter, publicProcedure } from "@/shared/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        email: z.string().email(),
        password: z.string().min(8).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const { name, email } = input;

      // Normalize email for consistent lookups (simple example)
      const normalizedEmail = email.trim().toLowerCase();

      // 1) Check if a Credentials row already exists for this email
      const existingCred = await db.credentials.findUnique({
        where: { email: normalizedEmail },
      });
      if (existingCred) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists.",
        });
      }

      // 2) Find or create a User with this email
      //    - If a User exists (e.g., created via OAuth), attach credentials to it.
      //    - Else create a new User.
      const existingUser = await db.user.findUnique({
        where: { email: normalizedEmail },
      });

      const passwordHash = await bcrypt.hash(input.password, 12);

      const userId =
        existingUser?.id ??
        (
          await db.user.create({
            data: {
              email: normalizedEmail,
              name: name ?? null,
            },
            select: { id: true },
          })
        ).id;

      // 3) Create Credentials row
      await db.credentials.create({
        data: {
          userId,
          email: normalizedEmail,
          passwordHash,
        },
      });

      // 4) Return a minimal payload (never return the hash)
      return {
        ok: true,
        userId,
      };
    }),
});
