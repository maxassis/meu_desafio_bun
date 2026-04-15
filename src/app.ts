import { openapi } from "@elysiajs/openapi";
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { authPlugin } from "./features/auth/auth.plugin";
import { helloRoutes } from "./features/hello/hello.route";
import { authOpenAPI } from "./lib/auth";
import { env } from "./shared/config/env";

const allowedOrigins = Array.from(
  new Set(
    [env.frontendUrl, env.betterAuthUrl, "http://localhost:5173", "http://127.0.0.1:5173"].filter(
      (origin): origin is string => Boolean(origin),
    ),
  ),
);

export const app = new Elysia()
  .use(
    cors({
      credentials: true,
      origin: allowedOrigins,
    }),
  )
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
