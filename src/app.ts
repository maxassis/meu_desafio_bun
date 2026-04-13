import { node } from "@elysiajs/node";
import { Elysia } from "elysia";

import { authPlugin } from "./features/auth/auth.plugin";
import { helloRoutes } from "./features/hello/hello.route";

export const app = new Elysia({ adapter: node() })
  .use(authPlugin)
  .use(helloRoutes);
