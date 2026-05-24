import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cors } from '@elysiajs/cors'
import { openapi } from '@elysiajs/openapi'
import { Elysia } from 'elysia'

import { ENV } from 'varlock/env'
import { authOpenAPI } from './lib/auth'
import { authPlugin } from './modules/auth/auth.plugin'
import { desafioRoutes } from './modules/desafio/desafio.routes'
import { stravaRoutes } from './modules/integrations/strava.routes'
import { taskRoutes } from './modules/task/task.routes'
import { usersRoutes } from './modules/users/users.routes'
import { errorHandler } from './shared/error-handler'

const allowedOrigins = Array.from(
  new Set(
    [ENV.FRONTEND_URL, ENV.BETTER_AUTH_URL]
      .filter((origin): origin is string => Boolean(origin)),
  ),
)

export const app = new Elysia()
  .onError(errorHandler)
  .use(
    cors({
      credentials: true,
      origin: allowedOrigins,
    }),
  )
  .use(
    openapi({
      path: '/openapi',
      documentation: {
        info: {
          title: 'Meu Desafio Bun API',
          version: '1.0.50',
        },
        tags: [
          { name: 'Better Auth', description: 'Native Better Auth routes' },
          { name: 'Desafio', description: 'Challenge operations' },
          { name: 'Integrations', description: 'External service integrations' },
          { name: 'Users', description: 'User operations' },
          { name: 'Tasks', description: 'Task operations' },
        ],
        components: (await authOpenAPI.components) as any,
        paths: (await authOpenAPI.getPaths('/api/auth')) as any,
      },
    }),
  )
  .use(authPlugin)
  .use(desafioRoutes)
  .use(stravaRoutes)
  .use(usersRoutes)
  .use(taskRoutes)
  .get('/strava-test', async () => {
    const filePath = join(process.cwd(), 'strava-test.html')
    const html = readFileSync(filePath, 'utf-8')
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    })
  })
