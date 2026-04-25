import { z } from 'zod'

const Gender = z.enum([
  'homem',
  'mulher',
  'nao_binario',
  'prefiro_nao_responder',
])

const Sports = z.enum(['corrida', 'bicicleta'])

export const EditUserDataSchema = z.object({
  avatar_url: z.string().nullable().optional(),
  avatar_filename: z.string().nullable().optional(),
  full_name: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  gender: Gender.nullable().optional(),
  sport: Sports.nullable().optional(),
  birthDate: z.string().nullable().optional(),
})

export type EditUserDataInput = z.infer<typeof EditUserDataSchema>
