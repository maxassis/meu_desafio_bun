import { Elysia, t } from 'elysia'

import { BadRequestError } from '../../shared/errors'
import { getRequiredSession } from '../auth/auth.middleware'
import {
  EditUserDataSchema,
  GetRankingParamsSchema,
  GetUserProfileParamsSchema,
} from './schema'
import {
  checkEmailExists,
  deleteAvatar,
  editUserData,
  getRanking,
  getUserData,
  getUserProfile,
  uploadAvatar,
} from './services'

export const usersRoutes = new Elysia({ prefix: '/users' })
  .post(
    '/check-email',
    async ({ body }) => {
      const { email } = body as { email: string }
      return checkEmailExists(email)
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
      }),
      response: t.Object({
        exists: t.Boolean(),
      }),
      detail: {
        tags: ['Users'],
        summary: 'Check if email exists',
      },
    },
  )
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

      return await getUserProfile(params.id)
    },
    {
      params: GetUserProfileParamsSchema,
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

      return await getRanking(params.desafioId)
    },
    {
      params: GetRankingParamsSchema,
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

      return editUserData(session.user.id, {
        avatarFilename: body.avatar_filename,
        bio: body.bio,
        gender: body.gender,
        sport: body.sport,
        birthDate: body.birthDate,
        name: body.full_name ?? undefined,
      })
    },
    {
      body: EditUserDataSchema,
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
