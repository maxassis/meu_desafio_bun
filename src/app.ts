import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";

import { authPlugin } from "./features/auth/auth.plugin";
import { helloRoutes } from "./features/hello/hello.route";
import { authOpenAPI } from "./lib/auth";

export const app = new Elysia()
  .use(
    openapi({
      path: "/openapi",
      documentation: {
        info: {
          title: "Meu Desafio Bun API",
          version: "1.0.50",
        },
        tags: [{ name: "Better Auth", description: "Rotas nativas do Better Auth" }],
        components: (await authOpenAPI.components) as any,
        paths: (await authOpenAPI.getPaths("/api/auth")) as any,
      },
    }),
  )
  .use(authPlugin)
  .use(helloRoutes);
