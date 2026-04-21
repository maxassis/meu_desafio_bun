import { z } from 'zod'

export const CheckCompletionSchema = z.object({
  inscriptionId: z.coerce.number().int().positive(),
  distance: z.coerce.number().nonnegative(),
})

export type CheckCompletionInput = z.infer<typeof CheckCompletionSchema>
