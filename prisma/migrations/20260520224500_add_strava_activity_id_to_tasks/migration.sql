ALTER TABLE "tasks"
ADD COLUMN "stravaActivityId" INTEGER;

CREATE UNIQUE INDEX "tasks_inscriptionId_stravaActivityId_key"
ON "tasks"("inscriptionId", "stravaActivityId");
