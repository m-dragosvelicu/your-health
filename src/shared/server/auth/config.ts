import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/shared/server/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { rateLimitOrThrow, recordAttempt } from "../security/rate-limit";
import { logAudit } from "../audit";
import { AuditAction } from "@prisma/client";
// Note: we read Google OAuth from process.env to keep typecheck simple

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
// Configure providers based on available environment variables. In development, Google can be optional.

const CredentialsSchema = z.object({
  email: z.string().email().transform((e) => e.trim().toLowerCase()),
  password: z.string().min(8).max(100),
});

const SignOutEventSchema = z.object({
  token: z.object({ sub: z.string().optional() }).optional(),
});

export const authConfig = {
  adapter: PrismaAdapter(db),

  // Credentials provider requires JWT strategy - database sessions don't work with it
  session: { strategy: "jwt" },

  events: {
    signIn: async ({ user, account, isNewUser }) => {
      await logAudit({
        action: AuditAction.LOGIN,
        userId: user.id,
        metadata: {
          provider: account?.provider,
          isNewUser,
        },
      });
    },
    signOut: async (payload) => {
      const parsed = SignOutEventSchema.safeParse(payload);
      const userId = parsed.success ? parsed.data.token?.sub ?? null : null;
      await logAudit({
        action: AuditAction.LOGOUT,
        userId,
      });
    },
    createUser: async ({ user }) => {
      await logAudit({
        action: AuditAction.USER_REGISTERED,
        userId: user.id,
      });
    },
  },

  providers: [
    // Discord provider reads AUTH_DISCORD_ID / AUTH_DISCORD_SECRET automatically in v5
    DiscordProvider,
    // Only include Google provider when credentials are present (helps local dev without secrets)
    ...((process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    Credentials({
      id: "credentials",
      name: "Email & Password",

      // These describe expected form fields; NextAuth posts them to `authorize`.
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      // Runs on the server when you call signIn("credentials", { email, password })
      authorize: async (raw, req) => {
        // 1) Validate input shape and normalize email
        const parsed = CredentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const ip =
          req?.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim?.() ??
          null;
        await rateLimitOrThrow(
          { action: "login", email, ip },
          { windowMinutes: 15, maxAttempts: 20 },
        );

        // 2) Fetch the credentials row + linked user
        const cred = await db.credentials.findUnique({
          where: { email },
          include: { user: true },
        });

        if (!cred || !cred.user) {
          await recordAttempt({ action: "login", email, ip }, false);
          return null;
        }

        // 3) Verify password hash (salt is embedded in the hash)
        const ok = await bcrypt.compare(password, cred.passwordHash);
        await recordAttempt({ action: "login", email, ip }, ok);
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
    async jwt({ token, user }) {
      // On sign-in, persist user.id into the JWT
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // With JWT strategy, user info comes from the token
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
