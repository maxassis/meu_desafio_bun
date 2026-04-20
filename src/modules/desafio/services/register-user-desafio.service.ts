import { cacheService } from '../../../lib/cache/redis'
import { prisma } from '../../../shared/db/prisma'

export async function registerUserDesafio(idDesafio: string, userId: string) {
  const desafio = await prisma.desafio.findUnique({
    where: { id: idDesafio },
    include: {
      inscriptions: {
        where: { userId },
        select: { id: true },
      },
    },
  })

  if (!desafio) {
    throw new Error(`Challenge with ID ${idDesafio} not found`)
  }

  if (desafio.inscriptions.length > 0) {
    throw new Error('User already registered for this challenge')
  }

  await prisma.inscription.create({
    data: {
      desafioId: idDesafio,
      progress: 0,
      userId,
    },
  })

  await Promise.all([
    cacheService.del(`desafio:${idDesafio}`),
    cacheService.del(`user:${userId}:desafios`),
    cacheService.del(`user:profile:${userId}`),
  ])

  return {
    message: 'User registered successfully',
  }
}
