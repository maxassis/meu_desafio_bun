import { cacheService } from "../../../lib/cache/redis";
import { prisma } from "../../../shared/db/prisma";

const CACHE_TTL_SECONDS = 600;

export async function getAllDesafio(userId: string) {
  const cacheKey = `user:${userId}:desafios`;

  const cachedDesafios = await cacheService.get<unknown[]>(cacheKey);
  if (cachedDesafios) {
    return cachedDesafios;
  }

  const desafios = await prisma.desafio.findMany({
    select: {
      id: true,
      name: true,
      distance: true,
      photo: true,
    },
  });

  const inscriptions = await prisma.inscription.findMany({
    where: { userId },
    select: {
      id: true,
      desafioId: true,
      completed: true,
      completedAt: true,
      progress: true,
      tasks: {
        select: {
          distanceKm: true,
          duration: true,
          id: true,
        },
      },
    },
  });

  const inscriptionsMap = new Map<
    string,
    {
      inscriptionId: number;
      completed: boolean;
      completedAt: Date | null;
      progress: number;
      totalDistanceKm: number;
      tasksCount: number;
      totalDuration: number;
    }
  >();

  for (const inscription of inscriptions) {
    const totalDistanceKm = inscription.tasks.reduce(
      (sum, task) => sum + Number(task.distanceKm || 0),
      0,
    );

    const tasksCount = inscription.tasks.length;
    const totalDuration = inscription.tasks.reduce(
      (sum, task) => sum + Number(task.duration || 0),
      0,
    );

    inscriptionsMap.set(inscription.desafioId, {
      inscriptionId: inscription.id,
      completed: inscription.completed,
      completedAt: inscription.completedAt,
      progress: Number(inscription.progress),
      totalDistanceKm,
      tasksCount,
      totalDuration,
    });
  }

  const desafiosComStatus = desafios.map((desafio) => {
    const inscription = inscriptionsMap.get(desafio.id);

    let progressPercentage = 0;
    let totalDistanceCompleted = 0;

    if (inscription) {
      const challengeDistance = Number(desafio.distance);

      totalDistanceCompleted = inscription.completed
        ? challengeDistance
        : inscription.totalDistanceKm;

      progressPercentage =
        challengeDistance > 0
          ? Math.min(100, (inscription.progress / challengeDistance) * 100)
          : 0;
    }

    return {
      ...desafio,
      isRegistered: Boolean(inscription),
      inscriptionId: inscription?.inscriptionId ?? null,
      completed: inscription?.completed ?? false,
      completedAt: inscription?.completedAt ?? null,
      progressPercentage,
      totalDistanceCompleted,
      tasksCount: inscription?.tasksCount ?? 0,
      totalDuration: inscription?.totalDuration ?? 0,
    };
  });

  await cacheService.set(cacheKey, desafiosComStatus, CACHE_TTL_SECONDS);

  return desafiosComStatus;
}
