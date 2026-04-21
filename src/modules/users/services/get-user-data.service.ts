import { cacheService } from '../../../lib/cache/redis'
import { env } from '../../../shared/config/env'
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

function getAvatarUrl(avatarFilename: string | null) {
  if (!avatarFilename || !env.r2PublicUrlAvatars) {
    return null
  }

  return `${env.r2PublicUrlAvatars}/${avatarFilename}`
}

function mapUserDataResponse(userData: UserDataCache, name: string) {
  const avatarUrl = getAvatarUrl(userData?.avatarFilename ?? null)
  const { avatarFilename: _avatarFilename, userId: _userId, ...rest } = userData ?? {}

  return {
    ...rest,
    avatar_filename: userData?.avatarFilename ?? null,
    avatar_url: avatarUrl,
    full_name: name,
    username: name,
    usersId: userData?.userId ?? null,
  }
}

export async function getUserData(id: string, name: string) {
  const cacheKey = `user:${id}:data`

  const cachedUserData = await cacheService.get<UserDataCache>(cacheKey)
  if (cachedUserData) {
    return mapUserDataResponse(cachedUserData, name)
  }

  const userData = await prisma.userData.findUnique({
    where: {
      userId: id,
    },
  })

  await cacheService.set(cacheKey, userData, CACHE_TTL_SECONDS)

  return mapUserDataResponse(userData, name)
}
