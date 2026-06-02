import { z } from 'zod'

const StravaActivitySchema = z.object({
  stravaActivityId: z.coerce.string().min(1, 'Strava activity ID is required'),
  name: z.string().min(1, 'Task name is required'),
  environment: z.enum(['livre', 'esteira']),
  distance: z.coerce.number().nonnegative(),
  duration: z.coerce.number().nonnegative().default(0),
  calories: z.coerce.number().int().nonnegative().optional().nullable(),
  date: z.coerce.date(),
})

export const ImportStravaTasksSchema = z.object({
  inscriptionId: z.coerce.number().int().positive(),
  activities: z.array(StravaActivitySchema).min(1, 'At least one activity is required'),
})

export type ImportStravaTasksInput = z.infer<typeof ImportStravaTasksSchema>
