import { prisma } from '../../../shared/db/prisma'
import { NotFoundError } from '../../../shared/errors'

export async function checkCompletion(
  userId: string,
  inscriptionId: number,
  distanceCovered: number,
) {
  const inscription = await prisma.inscription.findFirst({
    where: {
      id: inscriptionId,
      userId,
    },
    include: {
      desafio: {
        select: {
          distance: true,
        },
      },
    },
  })

  if (!inscription) {
    throw new NotFoundError('Inscription not found or does not belong to the user')
  }

  const currentProgress = Number(inscription.progress)
  const totalProgress = currentProgress + distanceCovered
  const challengeDistance = Number(inscription.desafio.distance)

  return {
    willCompleteChallenge: totalProgress >= challengeDistance,
  }
}
