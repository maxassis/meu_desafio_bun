import { Elysia, t } from "elysia";

import { createProtectedRoutes, resolveSession } from "../auth/auth.middleware";
import { editUserData, getUserData, getUserProfile } from "./services";

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
  )
  .get(
    "/get-user-profile/:id",
    async ({ params }) => {
      try {
        return await getUserProfile(params.id);
      } catch (error) {
        if (error instanceof Error && error.message.includes("User not found")) {
          return new Response(JSON.stringify({ message: error.message }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        throw error;
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Users"],
        summary: "Buscar perfil de usuario por id",
      },
    },
  )
  .patch(
    "/edit-user-data",
    async ({ body, request }) => {
      const session = await resolveSession(request);

      const parsedBody = body as {
        avatarFilename?: string | null;
        bio?: string | null;
        gender?: "homem" | "mulher" | "nao_binario" | "prefiro_nao_responder" | null;
        sport?: "corrida" | "bicicleta" | null;
        birthDate?: string | null;
      };

      return editUserData(session!.user.id, parsedBody);
    },
    {
      body: t.Object({
        avatarFilename: t.Optional(t.Union([t.String(), t.Null()])),
        bio: t.Optional(t.Union([t.String(), t.Null()])),
        gender: t.Optional(t.Union([
          t.Literal("homem"),
          t.Literal("mulher"),
          t.Literal("nao_binario"),
          t.Literal("prefiro_nao_responder"),
        ])),
        sport: t.Optional(t.Union([
          t.Literal("corrida"),
          t.Literal("bicicleta"),
        ])),
        birthDate: t.Optional(t.Union([t.String(), t.Null()])),
      }),
      detail: {
        tags: ["Users"],
        summary: "Editar dados do usuario autenticado",
      },
    },
  );
