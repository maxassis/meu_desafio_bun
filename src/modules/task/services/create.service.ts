import { cacheService } from "../../../lib/cache/redis";
import { prisma } from "../../../shared/db/prisma";
import { CreateTaskInput } from "../schema/create.schema";

export async function createTask(input: CreateTaskInput, userId: string) {
  const userInscription = await prisma.inscription.findFirst({
    where: {
      id: input.inscriptionId,
      userId,
    },
    include: {
      desafio: {
        select: {
          id: true,
          distance: true,
        },
      },
    },
  });

  if (!userInscription) {
    throw new Error("Usuario nao esta cadastrado no desafio");
  }

  if (userInscription.completed) {
    throw new Error("Este desafio ja foi concluido. Nao e possivel adicionar novas tarefas.");
  }

  return prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        name: input.name,
        environment: input.environment,
        date: input.date ? new Date(input.date) : null,
        duration: input.duration,
        calories: input.calories,
        local: input.local ?? null,
        distanceKm: input.distance,
        inscriptionId: input.inscriptionId,
        userId,
        gpsTask: input.gpsTask,
      },
    });

    const tasks = await tx.task.findMany({
      where: {
        userId,
        inscriptionId: input.inscriptionId,
      },
      select: {
        distanceKm: true,
      },
    });

    const totalDistance = tasks.reduce(
      (sum, currentTask) => sum + Number(currentTask.distanceKm || 0),
      0,
    );

    const desafioDistance = Number(userInscription.desafio.distance);
    const isCompleted = totalDistance >= desafioDistance;
    const progressToSave = isCompleted ? desafioDistance : totalDistance;

    await tx.inscription.update({
      where: { id: input.inscriptionId },
      data: {
        progress: progressToSave,
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    await Promise.all([
      cacheService.del(`desafio:${userInscription.desafio.id}`),
      cacheService.del(`user:${userId}:desafios`),
      cacheService.del(`user:${userId}:inscription:${input.inscriptionId}:tasks`),
    ]);

    return {
      message: "Tarefa criada com sucesso",
      task,
    };
  });
}
