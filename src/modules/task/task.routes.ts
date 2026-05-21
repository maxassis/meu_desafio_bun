import { Elysia } from 'elysia'

import { getRequiredSession } from '../auth/auth.middleware'
import {
  CheckCompletionSchema,
  CreateTaskSchema,
  DeleteTaskParamsSchema,
  GetTasksParamsSchema,
  ImportStravaTasksSchema,
  UpdateTaskSchema,
} from './schema'
import { checkCompletion, createTask, deleteTask, getTasks, importStravaTasks, updateTask } from './services'

export const taskRoutes = new Elysia({ prefix: '/tasks' })
  .post(
    '/create',
    async ({ body, request }) => {
      const session = await getRequiredSession(request)
      const parsedBody = CreateTaskSchema.parse(body)

      return await createTask(parsedBody, session.user.id)
    },
    {
      detail: {
        tags: ['Tasks'],
        summary: 'Create a task for a user inscription',
      },
    },
  )
  .post(
    '/import-strava',
    async ({ body, request }) => {
      const session = await getRequiredSession(request)
      const parsedBody = ImportStravaTasksSchema.parse(body)

      return await importStravaTasks(parsedBody, session.user.id)
    },
    {
      detail: {
        tags: ['Tasks'],
        summary: 'Import selected Strava activities as tasks',
      },
    },
  )
  .get(
    '/get-tasks/:inscriptionId',
    async ({ params, request }) => {
      const session = await getRequiredSession(request)
      const { inscriptionId } = GetTasksParamsSchema.parse(params)

      return getTasks(session.user.id, inscriptionId)
    },
    {
      detail: {
        tags: ['Tasks'],
        summary: 'Get user tasks by inscription',
      },
    },
  )
  .post(
    '/check-completion',
    async ({ body, request }) => {
      const session = await getRequiredSession(request)
      const parsedBody = CheckCompletionSchema.parse(body)

      return await checkCompletion(
        session.user.id,
        parsedBody.inscriptionId,
        parsedBody.distance,
      )
    },
    {
      detail: {
        tags: ['Tasks'],
        summary: 'Check if a task distance completes the challenge',
      },
    },
  )
  .delete(
    '/delete-task/:taskId',
    async ({ params, request }) => {
      const session = await getRequiredSession(request)
      const { taskId } = DeleteTaskParamsSchema.parse(params)

      return deleteTask(session.user.id, taskId)
    },
    {
      detail: {
        tags: ['Tasks'],
        summary: 'Delete a user task',
      },
    },
  )
  .patch(
    '/update-task/:taskId',
    async ({ body, params, request }) => {
      const session = await getRequiredSession(request)
      const parsedBody = UpdateTaskSchema.parse(body)
      const { taskId } = DeleteTaskParamsSchema.parse(params)

      return updateTask(session.user.id, taskId, parsedBody)
    },
    {
      detail: {
        tags: ['Tasks'],
        summary: 'Update a user task',
      },
    },
  )
