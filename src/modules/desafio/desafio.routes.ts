import { Elysia, t } from "elysia";
import { createProtectedRoutes } from "../auth/auth.middleware";
import { createDesafio } from "./services/create.service";
import { getDesafio } from "./services/get.service";
import { CreateDesafioSchema } from "./schema/create.schema";
import { GetDesafioParamsSchema } from "./schema/get.schema";

export const desafioRoutes = new Elysia({ prefix: "/desafio" })
  .use(createProtectedRoutes("desafio-auth-guard"))
  .post(
    "/create",
    async ({ body }) => {

      const bodyAny = body as unknown as {
        name: unknown;
        location: unknown;
        distance: unknown;
        active: unknown;
        priceId: unknown;
        purchaseData: unknown;
        images?: unknown;
      };

      const parsed = CreateDesafioSchema.parse({
        name: bodyAny.name,
        location: bodyAny.location,
        distance: bodyAny.distance,
        active: bodyAny.active,
        priceId: bodyAny.priceId,
        purchaseData: bodyAny.purchaseData,
      });

      const files = Array.isArray(bodyAny.images)
        ? bodyAny.images
        : bodyAny.images
          ? [bodyAny.images]
          : [];

      const result = await createDesafio(
        {
          name: parsed.name,
          location: parsed.location,
          distance: parsed.distance,
          active: parsed.active,
          priceId: parsed.priceId,
          purchaseData: parsed.purchaseData,
        },
        files,
      );

      return result;
    },
    {
      body: t.Files(),
      detail: {
        tags: ["Desafio"],
        summary: "Criar desafio",
      },
    },
  )
  .get(
    "/:id",
    async ({ params }) => {

      const { id } = GetDesafioParamsSchema.parse(params);

      try {
        const resultado = await getDesafio(id);
        return resultado;
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
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
        tags: ["Desafio"],
        summary: "Buscar desafio por id",
      },
    },
  );
