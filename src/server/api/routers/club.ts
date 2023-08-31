import { ClubIdInputSchema } from "~/components/Calendar";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const clubRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.club.findMany();
  }),

  getByClubId: publicProcedure
    .input(ClubIdInputSchema)
    .query(async ({ ctx, input }) => {
      if (typeof input.clubId !== "string") {
        //clubId come from the router, so it can also be an array of strings, or undefined
        throw new Error(`Server: invalid clubId`);
      }
      return await ctx.prisma.club.findUnique({
        where: {
          id: input.clubId,
        },
        include: {
          ClubPreferences: true,
        },
      });
    }),
});
