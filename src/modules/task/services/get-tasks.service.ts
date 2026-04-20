import { cacheService } from '../../../lib/cache/redis'
import { prisma } from '../../../shared/db/prisma'

const CACHE_TTL_SECONDS = 3600

export async function getTasks(userId: string, inscriptionId: number) {
  const cacheKey = `user:${userId}:inscription:${inscriptionId}:tasks`

  const cachedTasks = await cacheService.get<unknown[]>(cacheKey)
  if (cachedTasks) {
    return cachedTasks
  }

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      inscriptionId,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  await cacheService.set(cacheKey, tasks, CACHE_TTL_SECONDS)

  return tasks
}
