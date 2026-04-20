import type { GetDesafioResponse } from '../schema/get.schema'
import { cacheService } from '../../../lib/cache/redis'
import { prisma } from '../../../shared/db/prisma'

const CACHE_TTL_SECONDS = 300

export async function getDesafio(idDesafio: string): Promise<GetDesafioResponse> {
  const cacheKey = `desafio:${idDesafio}`

  const cachedDesafio = await cacheService.get<GetDesafioResponse>(cacheKey)
  if (cachedDesafio) {
    return cachedDesafio
  }

  const desafio = await prisma.desafio.findUnique({
    where: { id: idDesafio },
    include: {
      inscriptions: {
        where: { completed: false },
        include: {
          user: {
            include: {
              userData: {
                select: { avatarFilename: true },
              },
            },
          },
        },
      },
    },
  })

  if (!desafio) {
    throw new Error(`Desafio with ID ${idDesafio} not found`)
  }

  const inscriptionsWithStats = await Promise.all(
    desafio.inscriptions.map(async (inscription) => {
      const tasks = await prisma.task.findMany({
        where: { inscriptionId: inscription.id },
        select: {
          createdAt: true,
          calories: true,
          distanceKm: true,
        },
        orderBy: { createdAt: 'desc' },
      })

      const lastTaskDate = tasks.length > 0 ? tasks[0].createdAt : null

      const totalCalories = tasks.reduce(
        (sum, task) => sum + (task.calories || 0),
        0,
      )

      const totalDistanceKm = tasks.reduce(
        (sum, task) => sum + (Number(task.distanceKm) || 0),
        0,
      )

      return {
        user: {
          id: inscription.user.id,
          name: inscription.user.name,
          avatarFilename: inscription.user.userData?.avatarFilename ?? null,
        },
        progress: inscription.progress,
        totalTasks: tasks.length,
        totalCalories,
        totalDistanceKm,
        lastTaskDate,
      }
    }),
  )

  const result: GetDesafioResponse = {
    id: desafio.id,
    name: desafio.name,
    location: desafio.location,
    distance: desafio.distance,
    photo: desafio.photo,
    inscriptions: inscriptionsWithStats,
  }

  await cacheService.set(cacheKey, result, CACHE_TTL_SECONDS)

  return result
}
