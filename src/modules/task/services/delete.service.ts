import { cacheService } from '../../../lib/cache/redis'
import { prisma } from '../../../shared/db/prisma'

export async function deleteTask(userId: string, taskId: number) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      userId,
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

  await prisma.inscription.update({
    where: { id: inscriptionId },
    data: { progress: totalDistance },
  })

  const desafio = await prisma.desafio.findFirst({
    where: {
      inscription: {
        some: {
          id: inscriptionId,
        },
      },
    },
  })

  if (desafio) {
    await Promise.all([
      cacheService.del(`desafio:${desafio.id}`),
      cacheService.del(`user:${userId}:desafios`),
      cacheService.del(`user:${userId}:inscription:${inscriptionId}:tasks`),
    ])
  }

  return {
    message: 'Task deleted successfully',
  }
}
