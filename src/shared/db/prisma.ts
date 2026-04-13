import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { env } from "../config/env";
import { PrismaClient } from "../../generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: env.databaseUrl,
});

export const prisma = new PrismaClient({ adapter });
