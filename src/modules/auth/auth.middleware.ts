import { Elysia, t } from 'elysia'

import { auth } from '../../lib/auth'
import { UnauthorizedError } from '../../shared/errors'

export async function resolveSession(request: Request) {
  return auth.api.getSession({
    headers: request.headers,
  })
}

export async function getRequiredSession(request: Request) {
  const session = await resolveSession(request)

  if (!session?.session) {
    throw new UnauthorizedError()
  }

  return session
}

export function requireAuth() {
  return t.Object({
    headers: t.Object({
      authorization: t.String(),
    }),
  })
}

export function createProtectedRoutes(name = 'auth-guard') {
  return new Elysia({ name })
    .resolve(async ({ request }) => {
      const session = await resolveSession(request)
      return { session }
    })
    .onBeforeHandle(({ session }) => {
      if (!session?.session) {
        throw new UnauthorizedError()
      }
    })
}
