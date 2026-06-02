import type { ImportStravaTasksInput } from '../schema/import-strava.schema'

import { cacheService } from '../../../lib/cache/cache'
import { prisma } from '../../../shared/db/prisma'
import { BadRequestError, ForbiddenError } from '../../../shared/errors'

export async function importStravaTasks(input: ImportStravaTasksInput, userId: string) {
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
  })

  if (!userInscription) {
    throw new ForbiddenError('User is not registered for this challenge')
  }

  if (userInscription.completed) {
    throw new BadRequestError('This challenge is already completed. You cannot add more tasks.')
  }

  const result = await prisma.$transaction(async (tx) => {
    const createdTasks: Array<{ id: number, stravaActivityId: string }> = []
    let skipped = 0

    for (const activity of input.activities) {
      if (activity.date < userInscription.createdAt) {
        skipped += 1
        continue
      }

      try {
        const task = await tx.task.create({
          data: {
            name: activity.name,
            environment: activity.environment,
            stravaActivityId: activity.stravaActivityId,
            date: activity.date,
            duration: activity.duration,
            calories: activity.calories ?? null,
            local: null,
            distanceKm: activity.distance,
            inscriptionId: input.inscriptionId,
            userId,
            gpsTask: true,
          },
        })

        createdTasks.push({
          id: task.id,
          stravaActivityId: activity.stravaActivityId,
        })
      }
      catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
          skipped += 1
          continue
        }

        throw error
      }
    }

    if (createdTasks.length > 0) {
      const tasks = await tx.task.findMany({
        where: {
          userId,
          inscriptionId: input.inscriptionId,
        },
        select: {
          distanceKm: true,
        },
      })

      const totalDistance = tasks.reduce(
        (sum, currentTask) => sum + Number(currentTask.distanceKm || 0),
        0,
      )

      const desafioDistance = Number(userInscription.desafio.distance)
      const isCompleted = totalDistance >= desafioDistance
      const progressToSave = isCompleted ? desafioDistance : totalDistance

      await tx.inscription.update({
        where: { id: input.inscriptionId },
        data: {
          progress: progressToSave,
          completed: isCompleted,
          completedAt: isCompleted ? new Date() : null,
        },
      })
    }

    return {
      imported: createdTasks.length,
      skipped,
      createdTasks,
    }
  })

  await Promise.allSettled([
    cacheService.del(`desafio:${userInscription.desafio.id}`),
    cacheService.del(`user:${userId}:desafios`),
    cacheService.del(`user:${userId}:inscription:${input.inscriptionId}:tasks`),
  ])

  return {
    message: 'Strava activities imported successfully',
    ...result,
  }
}
