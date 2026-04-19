import { cacheService } from "../../../lib/cache/redis";
import { prisma } from "../../../shared/db/prisma";

const CACHE_TTL_SECONDS = 3600;

export async function getPurchaseData(desafioId: string) {
  const cacheKey = `desafio:${desafioId}:purchaseData`;

  const cachedPurchaseData = await cacheService.get<unknown>(cacheKey);
  if (cachedPurchaseData) {
    return cachedPurchaseData;
  }

  const desafio = await prisma.desafio.findUnique({
    where: { id: desafioId },
    select: { purchaseData: true },
  });

  if (!desafio) {
    throw new Error("Challenge not found");
  }

  await cacheService.set(cacheKey, desafio.purchaseData, CACHE_TTL_SECONDS);

  return desafio.purchaseData;
}
