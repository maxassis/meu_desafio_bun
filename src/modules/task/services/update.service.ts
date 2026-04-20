import type { UpdateTaskInput } from '../schema/update.schema'
import { cacheService } from '../../../lib/cache/redis'
import { prisma } from '../../../shared/db/prisma'

export async function updateTask(userId: string, taskId: number, input: UpdateTaskInput) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      userId,
    },
    include: {
      inscription: {
        include: {
          desafio: {
            select: {
              distance: true,
              id: true,
            },
          },
        },
      },
    },
  })

  if (!task) {
    throw new Error('Task not found')
  }

  return prisma.$transaction(async (tx) => {
    const updatedTask = await tx.task.update({
      where: {
        id: taskId,
      },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.environment !== undefined && { environment: input.environment }),
        ...(input.date !== undefined && { date: input.date ? new Date(input.date) : null }),
        ...(input.duration !== undefined && { duration: input.duration }),
        ...(input.calories !== undefined && { calories: input.calories }),
        ...(input.local !== undefined && { local: input.local }),
        ...(input.distanceKm !== undefined && { distanceKm: input.distanceKm }),
        ...(input.gpsTask !== undefined && { gpsTask: input.gpsTask }),
      },
    })

    const tasks = await tx.task.findMany({
      where: {
        userId,
        inscriptionId: task.inscriptionId,
      },
      select: {
        distanceKm: true,
      },
    })

    const totalDistance = tasks.reduce(
      (sum, currentTask) => sum + Number(currentTask.distanceKm || 0),
      0,
    )

    const desafioDistance = Number(task.inscription.desafio.distance)
    const isCompleted = totalDistance >= desafioDistance
    const progressToSave = isCompleted ? desafioDistance : totalDistance

    await tx.inscription.update({
      where: { id: task.inscriptionId },
      data: {
        progress: progressToSave,
        completed: isCompleted,
        completedAt: isCompleted ? task.inscription.completedAt ?? new Date() : null,
      },
    })

    await Promise.all([
      cacheService.del(`desafio:${task.inscription.desafio.id}`),
      cacheService.del(`user:${userId}:desafios`),
      cacheService.del(`user:${userId}:inscription:${task.inscriptionId}:tasks`),
      cacheService.del(`user:profile:${userId}`),
    ])

    return {
      message: 'Task updated successfully',
      task: updatedTask,
      progressUpdated: true,
    }
  })
}
