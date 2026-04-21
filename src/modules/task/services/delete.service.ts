import { cacheService } from '../../../lib/cache/redis'
import { prisma } from '../../../shared/db/prisma'

export async function deleteTask(userId: string, taskId: number) {
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

  const inscriptionId = task.inscriptionId

  await prisma.task.delete({
    where: {
      id: taskId,
    },
  })

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      inscriptionId,
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

  await prisma.inscription.update({
    where: { id: inscriptionId },
    data: {
      progress: progressToSave,
      completed: isCompleted,
      completedAt: isCompleted ? task.inscription.completedAt ?? new Date() : null,
    },
  })

  await Promise.all([
    cacheService.del(`desafio:${task.inscription.desafio.id}`),
    cacheService.del(`user:${userId}:desafios`),
    cacheService.del(`user:${userId}:inscription:${inscriptionId}:tasks`),
    cacheService.del(`user:profile:${userId}`),
  ])

  return {
    message: 'Task deleted successfully',
  }
}
