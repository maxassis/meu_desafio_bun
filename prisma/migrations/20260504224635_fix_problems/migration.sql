/*
  Warnings:

  - A unique constraint covering the columns `[userId,desafioId]` on the table `inscription` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "inscription_userId_desafioId_key" ON "inscription"("userId", "desafioId");
