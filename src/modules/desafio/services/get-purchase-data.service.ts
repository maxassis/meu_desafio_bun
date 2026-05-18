import { cacheService } from '../../../lib/cache/cache'
import { prisma } from '../../../shared/db/prisma'
import { NotFoundError } from '../../../shared/errors'

const CACHE_TTL_SECONDS = 60

export async function getPurchaseData(desafioId: string) {
  const cacheKey = `desafio:${desafioId}:purchaseData`

  const cachedPurchaseData = await cacheService.get<unknown>(cacheKey)
  if (cachedPurchaseData) {
    return cachedPurchaseData
  }

  const desafio = await prisma.desafio.findUnique({
    where: { id: desafioId },
    select: { purchaseData: true },
  })

  if (!desafio) {
    throw new NotFoundError('Challenge not found')
  }

  await cacheService.set(cacheKey, desafio.purchaseData, CACHE_TTL_SECONDS)

  return desafio.purchaseData
}
