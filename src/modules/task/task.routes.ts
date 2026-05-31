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

      return await createTask(body, session.user.id)
    },
    {
      body: CreateTaskSchema,
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

      return await importStravaTasks(body, session.user.id)
    },
    {
      body: ImportStravaTasksSchema,
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

      return getTasks(session.user.id, params.inscriptionId)
    },
    {
      params: GetTasksParamsSchema,
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

      return await checkCompletion(
        session.user.id,
        body.inscriptionId,
        body.distance,
      )
    },
    {
      body: CheckCompletionSchema,
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

      return deleteTask(session.user.id, params.taskId)
    },
    {
      params: DeleteTaskParamsSchema,
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

      return updateTask(session.user.id, params.taskId, body)
    },
    {
      body: UpdateTaskSchema,
      params: DeleteTaskParamsSchema,
      detail: {
        tags: ['Tasks'],
        summary: 'Update a user task',
      },
    },
  )
