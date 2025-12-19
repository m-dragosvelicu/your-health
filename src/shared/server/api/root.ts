import { authRouter } from "@/features/auth";
import { labRouter } from "@/features/labs";
import { medicationRouter } from "@/features/medications";
import { postRouter } from "@/features/posts";
import { createCallerFactory, createTRPCRouter } from "@/shared/server/api/trpc";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  lab: labRouter,
  medication: medicationRouter,
  post: postRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
