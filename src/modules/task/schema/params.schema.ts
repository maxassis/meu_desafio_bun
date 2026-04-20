import { z } from 'zod'

export const GetTasksParamsSchema = z.object({
  inscriptionId: z.coerce.number().int().positive(),
})

export const DeleteTaskParamsSchema = z.object({
  taskId: z.coerce.number().int().positive(),
})

export type GetTasksParams = z.infer<typeof GetTasksParamsSchema>
export type DeleteTaskParams = z.infer<typeof DeleteTaskParamsSchema>
