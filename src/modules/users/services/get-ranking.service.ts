import { cacheService } from '../../../lib/cache/redis'
import { env } from '../../../shared/config/env'
import { prisma } from '../../../shared/db/prisma'

const CACHE_TTL_SECONDS = 10000

function getAvatarUrl(avatarFilename: string | null) {
  if (!avatarFilename || !env.r2PublicUrlAvatars) {
    return null
  }

  return `${env.r2PublicUrlAvatars}/${avatarFilename}`
}

interface RankingItem {
  position: number
  userId: string
  userName: string
  userAvatar: string | null
  totalDistance: number
  totalDurationSeconds: number
  totalTasks: number
  progress: number
  progressPercent: number
  daysSinceStart: number
  dailyProgressRate: number
  avgSpeed: number
  completed: boolean
  completionBonus: number
  finalScore: number
}

export async function getRanking(desafioId: string): Promise<RankingItem[]> {
  const cacheKey = `desafio:${desafioId}:ranking`

  const cached = await cacheService.get<RankingItem[]>(cacheKey)
  if (cached) {
    return cached
  }

  const desafio = await prisma.desafio.findUnique({
    where: {
      id: desafioId,
    },
    select: {
      distance: true,
      id: true,
    },
  })

  if (!desafio) {
    throw new Error(`Challenge with ID ${desafioId} not found`)
  }

  const inscriptions = await prisma.inscription.findMany({
    where: {
      desafioId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          userData: {
            select: {
              avatarFilename: true,
            },
          },
        },
      },
      tasks: {
        select: {
          createdAt: true,
          date: true,
          distanceKm: true,
          duration: true,
        },
        orderBy: [
          { date: 'asc' },
          { createdAt: 'asc' },
        ],
      },
      _count: {
        select: { tasks: true },
      },
    },
  })

  const now = new Date()
  const challengeDistance = Number(desafio.distance)

  const rankings = inscriptions.map((inscription) => {
    const totalDistance = inscription.tasks.reduce(
      (sum, task) => sum + Number(task.distanceKm),
      0,
    )

    const totalDurationSeconds = inscription.tasks.reduce(
      (sum, task) => sum + Number(task.duration),
      0,
    )

    const firstTask = inscription.tasks[0]
    const startDate = firstTask
      ? new Date(firstTask.date ?? firstTask.createdAt)
      : now

    const daysSinceStart = Math.max(
      1,
      Math.ceil(
        (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ),
    )

    const progress = Number(inscription.progress)
    const progressPercent = challengeDistance > 0
      ? (progress / challengeDistance) * 100
      : 0
    const dailyProgressRate = progressPercent / daysSinceStart
    const completedInDays = inscription.completedAt
      ? Math.ceil(
          (new Date(inscription.completedAt).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        )
      : 0

    const completionBonus = inscription.completed && inscription.completedAt
      ? 100 * (1 - completedInDays / 30)
      : 0

    const finalScore = dailyProgressRate + completionBonus
    const avgSpeed = totalDurationSeconds > 0
      ? totalDistance / (totalDurationSeconds / 3600)
      : 0

    return {
      userId: inscription.user.id,
      userName: inscription.user.name,
      userAvatar: getAvatarUrl(inscription.user.userData?.avatarFilename ?? null),
      totalDistance: Number(totalDistance.toFixed(2)),
      totalDurationSeconds: Number(totalDurationSeconds.toFixed(2)),
      totalTasks: inscription._count.tasks,
      progress,
      progressPercent: Number(progressPercent.toFixed(2)),
      daysSinceStart,
      dailyProgressRate: Number(dailyProgressRate.toFixed(2)),
      avgSpeed: Number(avgSpeed.toFixed(2)),
      completed: inscription.completed,
      completionBonus: Number(completionBonus.toFixed(2)),
      finalScore: Number(finalScore.toFixed(2)),
    }
  })

  const finalRankings = rankings
    .sort((a, b) => b.finalScore - a.finalScore)
    .map((user, index) => ({
      position: index + 1,
      ...user,
    }))

  await cacheService.set(cacheKey, finalRankings, CACHE_TTL_SECONDS)

  return finalRankings
}
