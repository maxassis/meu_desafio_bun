import { Elysia } from 'elysia'

import { getRequiredSession } from '../auth/auth.middleware'
import { CreateDesafioMultipartSchema, GetDesafioParamsSchema } from './schema'
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

      const files = Array.isArray(body.images)
        ? body.images
        : body.images
          ? [body.images]
          : []

      const result = await createDesafio(
        {
          name: body.name,
          location: body.location,
          distance: body.distance,
          active: body.active,
          priceId: body.priceId,
          purchaseData: body.purchaseData,
        },
        files,
      )

      return result
    },
    {
      body: CreateDesafioMultipartSchema,
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

      return await registerUserDesafio(params.id, session.user.id)
    },
    {
      params: GetDesafioParamsSchema,
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

      const resultado = await getDesafio(params.id)
      return resultado
    },
    {
      params: GetDesafioParamsSchema,
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

      return await getPurchaseData(params.id)
    },
    {
      params: GetDesafioParamsSchema,
      detail: {
        tags: ['Desafio'],
        summary: 'Get challenge purchase data',
      },
    },
  )
