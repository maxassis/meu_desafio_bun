import { Elysia, t } from "elysia";

import { auth } from "../../lib/auth";

export async function resolveSession(request: Request) {
  return auth.api.getSession({
    headers: request.headers,
  });
}

export const unauthorizedResponse = {
  code: "UNAUTHORIZED",
  message: "Unauthorized",
} as const;

export function requireAuth() {
  return t.Object({
    headers: t.Object({
      authorization: t.String(),
    }),
  });
}

export function createProtectedRoutes(name = "auth-guard") {
  return new Elysia({ name })
    .resolve(async ({ request }) => {
      const session = await resolveSession(request);
      return { session };
    })
    .onBeforeHandle(({ session }) => {
      if (!session?.session) {
        return new Response(JSON.stringify(unauthorizedResponse), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    });
}
