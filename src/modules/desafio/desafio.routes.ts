import { Elysia, t } from "elysia";
import { createDesafio, getDesafio } from "./desafio.service";
import { CreateDesafioSchema } from "./schema/create.schema";
import { GetDesafioParamsSchema } from "./schema/get.schema";

export const desafioRoutes = new Elysia({ prefix: "/desafio" })
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

      console.log("[desafio/create] files from body:", files);
      console.log("[desafio/create] files length:", files.length);

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
    },
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      const { id } = GetDesafioParamsSchema.parse(params);

      try {
        const resultado = await getDesafio(id);
        return resultado;
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          set.status = 404;
          return { message: error.message };
        }
        throw error;
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  );