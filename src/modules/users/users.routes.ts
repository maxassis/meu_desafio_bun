import { Elysia } from 'elysia'
import { ZodError } from 'zod'

import { zodErrorResponse } from '../../shared/zod-error-response'
import { createProtectedRoutes, resolveSession } from '../auth/auth.middleware'
import {
  EditUserDataSchema,
  GetRankingParamsSchema,
  GetUserProfileParamsSchema,
} from './schema'
import {
  deleteAvatar,
  editUserData,
  getRanking,
  getUserData,
  getUserProfile,
  uploadAvatar,
} from './services'

export const usersRoutes = new Elysia({ prefix: '/users' })
  .use(createProtectedRoutes('users-auth-guard'))
  .get(
    '/get-user-data',
    async ({ request }) => {
      const session = await resolveSession(request)

      return getUserData(session!.user.id, session!.user.name)
    },
    {
      detail: {
        tags: ['Users'],
        summary: 'Get authenticated user data',
      },
    },
  )
  .get(
    '/get-user-profile/:id',
    async ({ params }) => {
      try {
        const { id } = GetUserProfileParamsSchema.parse(params)

        return await getUserProfile(id)
      }
      catch (error) {
        if (error instanceof ZodError) {
          return zodErrorResponse(error)
        }

        if (error instanceof Error && error.message.includes('User not found')) {
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
        tags: ['Users'],
        summary: 'Get user profile by ID',
      },
    },
  )
  .get(
    '/get-ranking/:desafioId',
    async ({ params }) => {
      try {
        const { desafioId } = GetRankingParamsSchema.parse(params)

        return await getRanking(desafioId)
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
        tags: ['Users'],
        summary: 'Get challenge ranking by ID',
      },
    },
  )
  .patch(
    '/edit-user-data',
    async ({ body, request }) => {
      try {
        const session = await resolveSession(request)
        const parsedBody = EditUserDataSchema.parse(body)

        return editUserData(session!.user.id, parsedBody)
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
        tags: ['Users'],
        summary: 'Update authenticated user data',
      },
    },
  )
  .post(
    '/upload-avatar',
    async ({ body, request }) => {
      try {
        const session = await resolveSession(request)
        const file = body && typeof body === 'object' && 'file' in body
          ? body.file
          : undefined

        if (!(file instanceof File)) {
          return new Response(JSON.stringify({ message: 'No file provided or invalid format' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        return await uploadAvatar(session!.user.id, file)
      }
      catch (error) {
        if (error instanceof Error && error.message.includes('User not found')) {
          return new Response(JSON.stringify({ message: error.message }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        if (
          error instanceof Error
          && (
            error.message.includes('No file provided')
            || error.message.includes('invalid format')
            || error.message.includes('not an image')
          )
        ) {
          return new Response(JSON.stringify({ message: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        throw error
      }
    },
    {
      detail: {
        tags: ['Users'],
        summary: 'Upload authenticated user avatar',
      },
    },
  )
  .delete(
    '/upload-avatar',
    async ({ request }) => {
      try {
        const session = await resolveSession(request)

        return await deleteAvatar(session!.user.id)
      }
      catch (error) {
        if (
          error instanceof Error
          && error.message.includes('User not found or avatar does not exist')
        ) {
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
        tags: ['Users'],
        summary: 'Delete authenticated user avatar',
      },
    },
  )
