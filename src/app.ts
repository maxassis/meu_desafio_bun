import { Elysia } from "elysia";

import { authPlugin } from "./features/auth/auth.plugin";
import { helloRoutes } from "./features/hello/hello.route";

export const app = new Elysia().use(authPlugin).use(helloRoutes);
