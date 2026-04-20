import { z } from 'zod'

export const GetUserProfileParamsSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
})

export type GetUserProfileParams = z.infer<typeof GetUserProfileParamsSchema>
