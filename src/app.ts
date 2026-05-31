import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'

import { ENV } from 'varlock/env'
import { routes } from './routes'
import { errorHandler } from './shared/error-handler'
import { openapiPlugin } from './shared/openapi/openapi.plugin'

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
    openapiPlugin,
  )
  .use(routes)
  .get('/strava-test', async () => {
    const filePath = join(process.cwd(), 'strava-test.html')
    const html = readFileSync(filePath, 'utf-8')
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    })
  })
