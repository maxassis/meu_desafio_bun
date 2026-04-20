import { z } from 'zod'

export const EditUserDataSchema = z.object({
  avatarFilename: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  gender: z.enum(['homem', 'mulher', 'nao_binario', 'prefiro_nao_responder']).nullable().optional(),
  sport: z.enum(['corrida', 'bicicleta']).nullable().optional(),
  birthDate: z.string().nullable().optional(),
})

export type EditUserDataInput = z.infer<typeof EditUserDataSchema>
