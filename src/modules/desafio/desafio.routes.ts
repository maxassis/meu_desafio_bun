import { Elysia } from 'elysia'
import { ZodError } from 'zod'

import { zodErrorResponse } from '../../shared/zod-error-response'
import { createProtectedRoutes, resolveSession } from '../auth/auth.middleware'
import { CreateDesafioMultipartSchema, CreateDesafioSchema, GetDesafioParamsSchema } from './schema'
import {
  createDesafio,
  getAllDesafio,
  getDesafio,
  getPurchaseData,
  registerUserDesafio,
} from './services'

export const desafioRoutes = new Elysia({ prefix: '/desafio' })
  .use(createProtectedRoutes('desafio-auth-guard'))
  .get(
    '/get-all-desafio',
    async ({ request }) => {
      const session = await resolveSession(request)

      return getAllDesafio(session!.user.id)
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
    async ({ body }) => {
      try {
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
      }
      catch (error) {
        if (error instanceof ZodError) {
          return zodErrorResponse(error)
        }

        throw error
      }
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
      try {
        const session = await resolveSession(request)
        const { id } = GetDesafioParamsSchema.parse(params)

        return await registerUserDesafio(id, session!.user.id)
      }
      catch (error) {
        if (error instanceof ZodError) {
          return zodErrorResponse(error)
        }

        if (error instanceof Error && error.message.includes('already registered')) {
          return new Response(JSON.stringify({ message: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        if (error instanceof Error && error.message.includes('not found')) {
          return new Response(JSON.stringify({ message: error.message }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        throw error
      }
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
    async ({ params }) => {
      try {
        const { id } = GetDesafioParamsSchema.parse(params)
        const resultado = await getDesafio(id)
        return resultado
      }
      catch (error) {
        if (error instanceof ZodError) {
          return zodErrorResponse(error)
        }

        if (error instanceof Error && error.message.includes('not found')) {
          return new Response(JSON.stringify({ message: error.message }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        throw error
      }
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
    async ({ params }) => {
      try {
        const { id } = GetDesafioParamsSchema.parse(params)
        return await getPurchaseData(id)
      }
      catch (error) {
        if (error instanceof ZodError) {
          return zodErrorResponse(error)
        }

        if (error instanceof Error && error.message.includes('not found')) {
          return new Response(JSON.stringify({ message: error.message }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        throw error
      }
    },
    {
      detail: {
        tags: ['Desafio'],
        summary: 'Get challenge purchase data',
      },
    },
  )
