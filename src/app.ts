import { cors } from '@elysiajs/cors'
import { openapi } from '@elysiajs/openapi'
import { Elysia } from 'elysia'

import { authOpenAPI } from './lib/auth'
import { authPlugin } from './modules/auth/auth.plugin'
import { desafioRoutes } from './modules/desafio/desafio.routes'
import { helloRoutes } from './modules/hello/hello.route'
import { taskRoutes } from './modules/task/task.routes'
import { usersRoutes } from './modules/users/users.routes'
import { env } from './shared/config/env'

const allowedOrigins = Array.from(
  new Set(
    [
      env.frontendUrl,
      env.betterAuthUrl,
      'http://localhost:3000',
      'http://localhost:5500',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5500',
      'http://127.0.0.1:5173',
    ].filter((origin): origin is string => Boolean(origin)),
  ),
)

export const app = new Elysia()
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
          { name: 'Users', description: 'User operations' },
          { name: 'Tasks', description: 'Task operations' },
        ],
        components: (await authOpenAPI.components) as any,
        paths: (await authOpenAPI.getPaths('/api/auth')) as any,
      },
    }),
  )
  .use(authPlugin)
  .use(helloRoutes)
  .use(desafioRoutes)
  .use(usersRoutes)
  .use(taskRoutes)
