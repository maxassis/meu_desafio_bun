import { cacheService } from '../../../lib/cache/cache'
import { r2Service } from '../../../lib/storage/r2'
import { prisma } from '../../../shared/db/prisma'
import { NotFoundError } from '../../../shared/errors'

export async function deleteAvatar(userId: string) {
  const bucketName = 'avatars'

  const userData = await prisma.userData.findUnique({
    where: {
      userId,
    },
  })

  if (!userData || !userData.avatarFilename) {
    throw new NotFoundError('User not found or avatar does not exist')
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
