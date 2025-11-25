import { postRouter } from "@/features/posts";
import { authRouter } from "@/features/auth";
import { createCallerFactory, createTRPCRouter } from "@/shared/server/api/trpc";
import { biomarkerRouter } from "./routers/biomarker";
import { labReportRouter } from "./routers/lab-report";
import { measurementRouter } from "./routers/measurement";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  auth: authRouter,
  biomarker: biomarkerRouter,
  labReport: labReportRouter,
  measurement: measurementRouter,
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
