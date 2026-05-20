CREATE TYPE "TaskEnvironment" AS ENUM ('livre', 'esteira');

UPDATE "tasks"
SET "environment" = 'livre'
WHERE "environment" IS NULL
   OR "environment" NOT IN ('livre', 'esteira');

ALTER TABLE "tasks"
ALTER COLUMN "environment" TYPE "TaskEnvironment"
USING ("environment"::"TaskEnvironment");
