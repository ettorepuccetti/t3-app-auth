import { createTRPCRouter } from "~/server/api/trpc";
import { exampleRouter } from "~/server/api/routers/example";
import { itemRouter as itemRouter } from "./routers/item";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  items: itemRouter,
  example: exampleRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
