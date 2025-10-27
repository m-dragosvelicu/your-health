import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { db } from "~/server/db";
import bcrypt from "bcryptjs";
import { z } from "zod"
import { rateLimitOrThrow, recordAttempt } from "../security/rate-limit";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing Google OAuth env vars");
}

const CredentialsSchema = z.object({
  email: z.string().email().transform((e) => e.trim().toLowerCase()),
  password: z.string().min(8).max(100),
});

export const authConfig = {
  adapter: PrismaAdapter(db),

  // Using DB sessions is fine with PrismaAdapter; NextAuth will persist sessions to your DB
  session: { strategy: "database" },
  //   session: ({ session, user }) => ({
  //     ...session,
  //     user: {
  //       ...session.user,
  //       id: user.id,
  //     },
  //   }),
  // },

  providers: [
    // Keep your working OAuth providers as-is
    DiscordProvider, // v5 can pick up AUTH_DISCORD_ID / AUTH_DISCORD_SECRET automatically
    GoogleProvider({
      // You already used explicit env vars here; keep it since it works in your project
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    Credentials({
      id: "credentials",
      name: "Email & Password",

      // These describe expected form fields; NextAuth posts them to `authorize`.
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      // Runs on the server when you call signIn("credentials", { email, password })
      authorize: async (raw , req) => {
        // 1) Validate input shape and normalize email
        const parsed = CredentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const ip = req?.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim?.() ?? null;
        await rateLimitOrThrow(
          {action: "login", email, ip},
          {windowMinutes:15, maxAttempts:20},
        );

        // 2) Fetch the credentials row + linked user
        const cred = await db.credentials.findUnique({
          where: { email },
          include: { user: true },
        });

        if (!cred || !cred.user){
          await recordAttempt({action: "login", email, ip}, false);
          return null;
        }

        // 3) Verify password hash (salt is embedded in the hash)
        const ok = await bcrypt.compare(password, cred.passwordHash);
        await recordAttempt({action: "login", email, ip}, ok)
        if (!ok) return null;

        // 4) Return a minimal user object; NextAuth will persist a session for this user
        return {
          id: cred.userId,
          email: cred.user.email,
          name: cred.user.name ?? null,
          image: cred.user.image ?? null,
        };
      },
    }),
  ],

  callbacks: {
    async session({ session, user, token }) {
      if (session.user) {
        // With database strategy, `user` is usually present; `token.sub` is a fallback.
        session.user.id = user?.id ?? token?.sub ?? session.user.id;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;