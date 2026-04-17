import { Elysia } from "elysia";

import { auth } from "../../lib/auth";

export async function resolveSession(request: Request) {
  return auth.api.getSession({
    headers: request.headers,
  });
}

export function unauthorizedResponse() {
  return {
    code: "UNAUTHORIZED",
    message: "Unauthorized",
  } as const;
}

export function createProtectedRoutes(name = "auth-guard") {
  return new Elysia({ name })
    .resolve(async ({ request }) => ({
      session: await resolveSession(request),
    }))
    .onBeforeHandle(({ session, status }) => {
      if (!session?.session) {
        return status(401, unauthorizedResponse());
      }
    });
}
