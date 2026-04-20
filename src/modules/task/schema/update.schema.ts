import { z } from 'zod'

export const UpdateTaskSchema = z.object({
  name: z.string().min(1, 'Task name is required').optional(),
  environment: z.string().min(1, 'Environment is required').optional(),
  date: z.union([z.string(), z.date()]).optional().nullable(),
  duration: z.coerce.number().nonnegative().optional(),
  calories: z.coerce.number().int().nonnegative().optional().nullable(),
  local: z.string().optional().nullable(),
  distanceKm: z.coerce.number().nonnegative().optional(),
  gpsTask: z.coerce.boolean().optional().nullable(),
})

export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>
