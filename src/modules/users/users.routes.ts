import { Elysia } from "elysia";

import { createProtectedRoutes, resolveSession } from "../auth/auth.middleware";
import { getUserData } from "./services";

export const usersRoutes = new Elysia({ prefix: "/users" })
  .use(createProtectedRoutes("users-auth-guard"))
  .get(
    "/get-user-data",
    async ({ request }) => {
      const session = await resolveSession(request);

      return getUserData(session!.user.id, session!.user.name);
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Buscar dados do usuario autenticado",
      },
    },
  );
