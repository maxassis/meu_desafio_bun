import { Prisma } from '../../../generated/prisma/client'
import { cacheService } from '../../../lib/cache/cache'
import { prisma } from '../../../shared/db/prisma'
import { BadRequestError, NotFoundError } from '../../../shared/errors'

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
    throw new NotFoundError(`Challenge with ID ${idDesafio} not found`)
  }

  if (desafio.inscriptions.length > 0) {
    throw new BadRequestError('User already registered for this challenge')
  }

  try {
    await prisma.inscription.create({
      data: {
        desafioId: idDesafio,
        progress: 0,
        userId,
      },
    })
  }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new BadRequestError('User already registered for this challenge')
    }

    throw error
  }

  await Promise.all([
    cacheService.del(`desafio:${idDesafio}`),
    cacheService.del(`user:${userId}:desafios`),
    cacheService.del(`user:profile:${userId}`),
  ])

  return {
    message: 'User registered successfully',
  }
}
