import { Elysia } from "elysia";

import { getHelloWorld } from "./hello.service";

export const helloRoutes = new Elysia().get("/", () => getHelloWorld());
