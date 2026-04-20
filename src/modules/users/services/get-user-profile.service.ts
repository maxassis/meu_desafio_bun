import { cacheService } from '../../../lib/cache/redis'
import { prisma } from '../../../shared/db/prisma'

const CACHE_TTL_SECONDS = 300

interface UserProfileResponse {
  name: string
  avatarFilename: string | null
  bio: string | null
  activeInscriptions: number
  completedChallengesCount: number
  completedChallenges: Array<{
    id: string
    name: string
    totalDistance: number
    completedAt: Date | null
    photo: string
  }>
  totalDistance: number
  recentTasks: Array<{
    id: number
    name: string
    environment: string
    date: Date | null
    duration: unknown
    calories: number | null
    local: string | null
    distanceKm: unknown
    inscriptionId: number
    userId: string | null
    createdAt: Date
    updatedAt: Date
    gpsTask: boolean | null
  }>
  activeChallenges: Array<{
    id: string
    name: string
    totalDistance: number
    distanceCovered: number
    completionPercentage: number
    photo: string
  }>
}

export async function getUserProfile(id: string): Promise<UserProfileResponse> {
  const cacheKey = `user:profile:${id}`

  const cachedProfile = await cacheService.get<UserProfileResponse>(cacheKey)
  if (cachedProfile) {
    return cachedProfile
  }

  const userData = await prisma.userData.findUnique({
    where: { userId: id },
    select: {
      avatarFilename: true,
      bio: true,
      user: {
        select: { name: true },
      },
    },
  })

  if (!userData) {
    throw new Error('User not found')
  }

  const [activeCount, completedCount, allInscriptions, recentTasks, activeInscriptions, completedChallengesList]
    = await Promise.all([
      prisma.inscription.count({
        where: { userId: id, completed: false },
      }),
      prisma.inscription.count({
        where: { userId: id, completed: true },
      }),
      prisma.inscription.findMany({
        where: { userId: id },
        select: {
          completed: true,
          desafio: {
            select: {
              distance: true,
            },
          },
          tasks: {
            select: {
              distanceKm: true,
            },
          },
        },
      }),
      prisma.task.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          environment: true,
          date: true,
          duration: true,
          calories: true,
          local: true,
          distanceKm: true,
          inscriptionId: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          gpsTask: true,
        },
      }),
      prisma.inscription.findMany({
        where: {
          userId: id,
          completed: false,
          desafio: { active: true },
        },
        select: {
          desafio: {
            select: {
              id: true,
              name: true,
              distance: true,
              photo: true,
            },
          },
          tasks: {
            select: {
              distanceKm: true,
            },
          },
        },
      }),
      prisma.inscription.findMany({
        where: { userId: id, completed: true },
        select: {
          completedAt: true,
          desafio: {
            select: {
              id: true,
              name: true,
              distance: true,
              photo: true,
            },
          },
        },
        orderBy: { completedAt: 'desc' },
      }),
    ])

  const totalDistance = allInscriptions.reduce((sum, inscription) => {
    if (inscription.completed) {
      return sum + Number(inscription.desafio.distance)
    }

    const taskDistance = inscription.tasks.reduce(
      (taskSum, task) => taskSum + Number(task.distanceKm),
      0,
    )

    return sum + taskDistance
  }, 0)

  const activeChallenges = activeInscriptions.map((inscription) => {
    const totalChallengeDistance = Number(inscription.desafio.distance)
    const distanceCovered = inscription.tasks.reduce(
      (sum, task) => sum + Number(task.distanceKm),
      0,
    )

    const completionPercentage = totalChallengeDistance > 0
      ? Math.min(Math.round((distanceCovered / totalChallengeDistance) * 100), 100)
      : 0

    return {
      id: inscription.desafio.id,
      name: inscription.desafio.name,
      totalDistance: totalChallengeDistance,
      distanceCovered,
      completionPercentage,
      photo: inscription.desafio.photo,
    }
  })

  const completedChallenges = completedChallengesList.map(inscription => ({
    id: inscription.desafio.id,
    name: inscription.desafio.name,
    totalDistance: Number(inscription.desafio.distance),
    completedAt: inscription.completedAt,
    photo: inscription.desafio.photo,
  }))

  const profile: UserProfileResponse = {
    name: userData.user.name,
    avatarFilename: userData.avatarFilename,
    bio: userData.bio,
    activeInscriptions: activeCount,
    completedChallengesCount: completedCount,
    completedChallenges,
    totalDistance,
    recentTasks,
    activeChallenges,
  }

  await cacheService.set(cacheKey, profile, CACHE_TTL_SECONDS)

  return profile
}
