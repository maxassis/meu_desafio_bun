import { Elysia } from 'elysia'
import { ZodError } from 'zod'

import { zodErrorResponse } from '../../shared/zod-error-response'
import { createProtectedRoutes, resolveSession } from '../auth/auth.middleware'
import {
  CreateTaskSchema,
  DeleteTaskParamsSchema,
  GetTasksParamsSchema,
  UpdateTaskSchema,
} from './schema'
import { createTask, deleteTask, getTasks, updateTask } from './services'

export const taskRoutes = new Elysia({ prefix: '/tasks' })
  .use(createProtectedRoutes('tasks-auth-guard'))
  .post(
    '/create',
    async ({ body, request }) => {
      try {
        const parsedBody = CreateTaskSchema.parse(body)
        const session = await resolveSession(request)

        return await createTask(parsedBody, session!.user.id)
      }
      catch (error) {
        if (error instanceof ZodError) {
          return zodErrorResponse(error)
        }

        if (
          error instanceof Error
          && error.message.includes('not registered for this challenge')
        ) {
          return new Response(JSON.stringify({ message: error.message }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        if (error instanceof Error && error.message.includes('already completed')) {
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
        tags: ['Tasks'],
        summary: 'Create a task for a user inscription',
      },
    },
  )
  .get(
    '/get-tasks/:inscriptionId',
    async ({ params, request }) => {
      try {
        const session = await resolveSession(request)
        const { inscriptionId } = GetTasksParamsSchema.parse(params)

        return getTasks(session!.user.id, inscriptionId)
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
        tags: ['Tasks'],
        summary: 'Get user tasks by inscription',
      },
    },
  )
  .delete(
    '/:taskId',
    async ({ params, request }) => {
      try {
        const session = await resolveSession(request)
        const { taskId } = DeleteTaskParamsSchema.parse(params)

        return deleteTask(session!.user.id, taskId)
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
        tags: ['Tasks'],
        summary: 'Delete a user task',
      },
    },
  )
  .patch(
    '/update-task/:taskId',
    async ({ body, params, request }) => {
      try {
        const session = await resolveSession(request)
        const parsedBody = UpdateTaskSchema.parse(body)
        const { taskId } = DeleteTaskParamsSchema.parse(params)

        return updateTask(session!.user.id, taskId, parsedBody)
      }
      catch (error) {
        if (error instanceof ZodError) {
          return zodErrorResponse(error)
        }

        if (error instanceof Error && error.message.includes('Task not found')) {
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
        tags: ['Tasks'],
        summary: 'Update a user task',
      },
    },
  )
