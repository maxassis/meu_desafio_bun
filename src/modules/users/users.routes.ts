import { Elysia } from 'elysia'

import { BadRequestError } from '../../shared/errors'
import { getRequiredSession } from '../auth/auth.middleware'
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
  .get(
    '/get-user-data',
    async ({ request }) => {
      const session = await getRequiredSession(request)

      return getUserData(session.user.id)
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
    async ({ params, request }) => {
      await getRequiredSession(request)

      const { id } = GetUserProfileParamsSchema.parse(params)

      return await getUserProfile(id)
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
    async ({ params, request }) => {
      await getRequiredSession(request)

      const { desafioId } = GetRankingParamsSchema.parse(params)

      return await getRanking(desafioId)
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
      const session = await getRequiredSession(request)
      const parsedBody = EditUserDataSchema.parse(body)

      return editUserData(session.user.id, {
        avatarFilename: parsedBody.avatar_filename,
        bio: parsedBody.bio,
        gender: parsedBody.gender,
        sport: parsedBody.sport,
        birthDate: parsedBody.birthDate,
        name: parsedBody.full_name ?? undefined,
      })
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
      const session = await getRequiredSession(request)
      const file = body && typeof body === 'object' && 'file' in body
        ? body.file
        : undefined

      if (!(file instanceof File)) {
        throw new BadRequestError('No file provided or invalid format')
      }

      return await uploadAvatar(session.user.id, file)
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
      const session = await getRequiredSession(request)

      return await deleteAvatar(session.user.id)
    },
    {
      detail: {
        tags: ['Users'],
        summary: 'Delete authenticated user avatar',
      },
    },
  )
