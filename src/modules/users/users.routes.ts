import { Elysia } from "elysia";
import { ZodError } from "zod";

import { createProtectedRoutes, resolveSession } from "../auth/auth.middleware";
import { zodErrorResponse } from "../../shared/zod-error-response";
import { EditUserDataSchema, GetUserProfileParamsSchema } from "./schema";
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
        summary: "Get authenticated user data",
      },
    },
  )
  .get(
    "/get-user-profile/:id",
    async ({ params }) => {
      try {
        const { id } = GetUserProfileParamsSchema.parse(params);

        return await getUserProfile(id);
      } catch (error) {
        if (error instanceof ZodError) {
          return zodErrorResponse(error);
        }

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
      detail: {
        tags: ["Users"],
        summary: "Get user profile by ID",
      },
    },
  )
  .patch(
    "/edit-user-data",
    async ({ body, request }) => {
      try {
        const session = await resolveSession(request);
        const parsedBody = EditUserDataSchema.parse(body);

        return editUserData(session!.user.id, parsedBody);
      } catch (error) {
        if (error instanceof ZodError) {
          return zodErrorResponse(error);
        }

        throw error;
      }
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Update authenticated user data",
      },
    },
  );
