import { cacheService } from '../../../lib/cache/redis'
import { r2Service } from '../../../lib/storage/r2'
import { prisma } from '../../../shared/db/prisma'

export async function deleteAvatar(userId: string) {
  const bucketName = 'avatars'

  const userData = await prisma.userData.findUnique({
    where: {
      userId,
    },
  })

  if (!userData || !userData.avatarFilename) {
    throw new Error('User not found or avatar does not exist')
  }

  await r2Service.deleteFile(userData.avatarFilename, bucketName)

  await prisma.userData.update({
    where: {
      userId,
    },
    data: {
      avatarFilename: null,
    },
  })

  await Promise.all([
    cacheService.del(`user:${userId}:data`),
    cacheService.del(`user:profile:${userId}`),
  ])

  return { success: true }
}
