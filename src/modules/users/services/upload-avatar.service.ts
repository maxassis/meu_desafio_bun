import { Buffer } from 'node:buffer'

import { cacheService } from '../../../lib/cache/redis'
import { r2Service } from '../../../lib/storage/r2'
import { prisma } from '../../../shared/db/prisma'

function getFileExtension(file: File) {
  const nameExtension = file.name.split('.').pop()?.trim()
  if (nameExtension) {
    return nameExtension
  }

  return file.type.split('/').pop()?.trim() || ''
}

export async function uploadAvatar(userId: string, file: File) {
  if (!file.type) {
    throw new Error('No file provided or invalid format')
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('The uploaded file is not an image')
  }

  const userData = await prisma.userData.findUnique({
    where: { userId },
  })

  if (!userData) {
    throw new Error('User not found')
  }

  const fileExtension = getFileExtension(file)
  const fileName = `${userId}-avatar-${Date.now()}${fileExtension ? `.${fileExtension}` : ''}`
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
