import { cacheService } from '../../../lib/cache/redis'
import { prisma } from '../../../shared/db/prisma'

const CACHE_TTL_SECONDS = 3600

type UserDataCache = {
  id: string
  avatarFilename: string | null
  bio: string | null
  gender: 'homem' | 'mulher' | 'nao_binario' | 'prefiro_nao_responder' | null
  sport: 'corrida' | 'bicicleta' | null
  birthDate: string | null
  createdAt: Date
  userId: string
} | null

export async function getUserData(id: string, name: string) {
  const cacheKey = `user:${id}:data`

  const cachedUserData = await cacheService.get<UserDataCache>(cacheKey)
  if (cachedUserData) {
    return {
      ...cachedUserData,
      username: name,
    }
  }

  const userData = await prisma.userData.findUnique({
    where: {
      userId: id,
    },
  })

  await cacheService.set(cacheKey, userData, CACHE_TTL_SECONDS)

  return {
    ...userData,
    username: name,
  }
}
