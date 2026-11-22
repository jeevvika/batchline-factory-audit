import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { factoryWorkspace } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // This workspace contains only the public benchmark's synthetic demo state.
  factory: router({
    load: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return null;
      const [record] = await db.select().from(factoryWorkspace).where(eq(factoryWorkspace.slug, "benchmark-demo")).limit(1);
      return record?.state ?? null;
    }),
    save: publicProcedure.input(z.record(z.string(), z.unknown())).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { saved: false };
      await db.insert(factoryWorkspace).values({ slug: "benchmark-demo", state: input }).onDuplicateKeyUpdate({ set: { state: input } });
      return { saved: true };
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
