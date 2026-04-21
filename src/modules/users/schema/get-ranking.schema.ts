import { z } from 'zod'

export const GetRankingParamsSchema = z.object({
  desafioId: z.string().min(1, 'Challenge ID is required'),
})

export type GetRankingParams = z.infer<typeof GetRankingParamsSchema>
