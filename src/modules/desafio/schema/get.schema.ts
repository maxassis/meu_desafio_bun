import { z } from "zod";

export const GetDesafioParamsSchema = z.object({
  id: z.string().min(1, "Challenge ID is required"),
});

export type GetDesafioParams = z.infer<typeof GetDesafioParamsSchema>;

export const GetDesafioResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.unknown(),
  distance: z.unknown(),
  photo: z.string(),
  inscriptions: z.array(
    z.object({
      user: z.object({
        id: z.string(),
        name: z.string(),
        avatarFilename: z.string().nullable(),
      }),
      progress: z.unknown(),
      totalTasks: z.number(),
      totalCalories: z.number(),
      totalDistanceKm: z.number(),
      lastTaskDate: z.date().nullable(),
    }),
  ),
});

export type GetDesafioResponse = z.infer<typeof GetDesafioResponseSchema>;
