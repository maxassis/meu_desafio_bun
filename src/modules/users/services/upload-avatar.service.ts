import { Buffer } from 'node:buffer'

import { cacheService } from '../../../lib/cache/cache'
import { r2Service } from '../../../lib/storage/r2'
import { prisma } from '../../../shared/db/prisma'
import { BadRequestError, NotFoundError } from '../../../shared/errors'

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024
const allowedAvatarTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const

function validateAvatarFile(file: File) {
  const extension = allowedAvatarTypes[file.type as keyof typeof allowedAvatarTypes]

  if (!extension) {
    throw new BadRequestError('The uploaded file must be a JPEG, PNG, or WEBP image')
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    throw new BadRequestError('Avatar file size must be 2MB or less')
  }

  return extension
}

export async function uploadAvatar(userId: string, file: File) {
  if (!file.type) {
    throw new BadRequestError('No file provided or invalid format')
  }

  const fileExtension = validateAvatarFile(file)

  const userData = await prisma.userData.findUnique({
    where: { userId },
  })

  if (!userData) {
    throw new NotFoundError('User not found')
  }

  const fileName = `${userId}-avatar-${Date.now()}.${fileExtension}`
  const fileBuffer = Buffer.from(await file.arrayBuffer())
  const bucketName = 'avatars'

  await r2Service.uploadFile(
    fileName,
    fileBuffer,
    file.type,
    bucketName,
  )

  if (userData.avatarFilename) {
    r2Service.deleteFile(userData.avatarFilename, bucketName).catch((error: unknown) => {
      console.warn('Error deleting previous avatar:', error)
    })
  }

  await prisma.userData.update({
    where: { userId },
    data: {
      avatarFilename: fileName,
    },
  })

  await Promise.all([
    cacheService.del(`user:${userId}:data`),
    cacheService.del(`user:profile:${userId}`),
  ])

  return { success: true }
}
