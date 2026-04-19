import { Elysia, t } from "elysia";

import { createProtectedRoutes, resolveSession } from "../auth/auth.middleware";
import { createTask, deleteTask, getTasks } from "./services";
import { CreateTaskSchema } from "./schema";

export const taskRoutes = new Elysia({ prefix: "/tasks" })
  .use(createProtectedRoutes("tasks-auth-guard"))
  .post(
    "/create",
    async ({ body, request }) => {
      const parsedBody = CreateTaskSchema.parse(body);
      const session = await resolveSession(request);

      try {
        return await createTask(parsedBody, session!.user.id);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("nao esta cadastrado no desafio")
        ) {
          return new Response(JSON.stringify({ message: error.message }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (error instanceof Error && error.message.includes("ja foi concluido")) {
          return new Response(JSON.stringify({ message: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        throw error;
      }
    },
    {
      body: t.Object({
        name: t.String(),
        environment: t.String(),
        date: t.Optional(t.String()),
        duration: t.Union([t.Number(), t.String()]),
        calories: t.Optional(t.Union([t.Number(), t.String()])),
        local: t.Optional(t.String()),
        distance: t.Union([t.Number(), t.String()]),
        inscriptionId: t.Union([t.Number(), t.String()]),
        gpsTask: t.Optional(t.Boolean()),
      }),
      detail: {
        tags: ["Tasks"],
        summary: "Criar tarefa para inscricao do usuario",
      },
    },
  )
  .get(
    "/get-tasks/:inscriptionId",
    async ({ params, request }) => {
      const session = await resolveSession(request);
      const inscriptionId = Number(params.inscriptionId);

      if (isNaN(inscriptionId) || inscriptionId <= 0) {
        return new Response(
          JSON.stringify({ message: "inscriptionId invalido" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      return getTasks(session!.user.id, inscriptionId);
    },
    {
      params: t.Object({
        inscriptionId: t.Union([t.String(), t.Number()]),
      }),
      detail: {
        tags: ["Tasks"],
        summary: "Buscar tarefas do usuario por inscricao",
      },
    },
  )
  .delete(
    "/:taskId",
    async ({ params, request }) => {
      const session = await resolveSession(request);
      const taskId = Number(params.taskId);

      if (isNaN(taskId) || taskId <= 0) {
        return new Response(
          JSON.stringify({ message: "taskId invalido" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      return deleteTask(session!.user.id, taskId);
    },
    {
      params: t.Object({
        taskId: t.Union([t.String(), t.Number()]),
      }),
      detail: {
        tags: ["Tasks"],
        summary: "Deletar tarefa do usuario",
      },
    },
  );
