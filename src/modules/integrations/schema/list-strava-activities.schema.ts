import { z } from 'zod'

export const ListStravaActivitiesQuerySchema = z.object({
  inscriptionId: z.coerce.number().int().positive('inscriptionId query param is required and must be a positive integer'),
})

export type ListStravaActivitiesQuery = z.infer<typeof ListStravaActivitiesQuerySchema>
