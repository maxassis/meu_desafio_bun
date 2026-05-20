import { Elysia } from 'elysia'

import { getRequiredSession } from '../auth/auth.middleware'
import { CreateDesafioMultipartSchema, CreateDesafioSchema, GetDesafioParamsSchema } from './schema'
import {
  createDesafio,
  getAllDesafio,
  getDesafio,
  getPurchaseData,
  registerUserDesafio,
} from './services'

export const desafioRoutes = new Elysia({ prefix: '/desafio' })
  .get(
    '/get-all-desafio',
    async ({ request }) => {
      const session = await getRequiredSession(request)

      return getAllDesafio(session.user.id)
    },
    {
      detail: {
        tags: ['Desafio'],
        summary: 'List user challenges',
      },
    },
  )
  .post(
    '/create',
    async ({ body, request }) => {
      await getRequiredSession(request)

      const parsedMultipartBody = CreateDesafioMultipartSchema.parse(body)
      const parsed = CreateDesafioSchema.parse({
        name: parsedMultipartBody.name,
        location: parsedMultipartBody.location,
        distance: parsedMultipartBody.distance,
        active: parsedMultipartBody.active,
        priceId: parsedMultipartBody.priceId,
        purchaseData: parsedMultipartBody.purchaseData,
      })

      const files = Array.isArray(parsedMultipartBody.images)
        ? parsedMultipartBody.images
        : parsedMultipartBody.images
          ? [parsedMultipartBody.images]
          : []

      const result = await createDesafio(
        {
          name: parsed.name,
          location: parsed.location,
          distance: parsed.distance,
          active: parsed.active,
          priceId: parsed.priceId,
          purchaseData: parsed.purchaseData,
        },
        files,
      )

      return result
    },
    {
      detail: {
        tags: ['Desafio'],
        summary: 'Create challenge',
      },
    },
  )
  .post(
    '/register-user-desafio/:id',
    async ({ params, request }) => {
      const session = await getRequiredSession(request)
      const { id } = GetDesafioParamsSchema.parse(params)

      return await registerUserDesafio(id, session.user.id)
    },
    {
      detail: {
        tags: ['Desafio'],
        summary: 'Register authenticated user in a challenge',
      },
    },
  )
  .get(
    '/:id',
    async ({ params, request }) => {
      await getRequiredSession(request)

      const { id } = GetDesafioParamsSchema.parse(params)
      const resultado = await getDesafio(id)
      return resultado
    },
    {
      detail: {
        tags: ['Desafio'],
        summary: 'Get challenge by ID',
      },
    },
  )
  .get(
    '/purchase-data/:id',
    async ({ params, request }) => {
      await getRequiredSession(request)

      const { id } = GetDesafioParamsSchema.parse(params)
      return await getPurchaseData(id)
    },
    {
      detail: {
        tags: ['Desafio'],
        summary: 'Get challenge purchase data',
      },
    },
  )
