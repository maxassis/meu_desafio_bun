import { cacheService } from "../../../lib/cache/redis";
import { prisma } from "../../../shared/db/prisma";

export async function editUserData(id: string, data: {
  avatarFilename?: string | null;
  bio?: string | null;
  gender?: "homem" | "mulher" | "nao_binario" | "prefiro_nao_responder" | null;
  sport?: "corrida" | "bicicleta" | null;
  birthDate?: string | null;
}) {
  const user = await prisma.userData.update({
    where: {
      userId: id,
    },
    data: {
      ...(data.avatarFilename !== undefined && { avatarFilename: data.avatarFilename }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.gender !== undefined && { gender: data.gender }),
      ...(data.sport !== undefined && { sport: data.sport }),
      ...(data.birthDate !== undefined && { birthDate: data.birthDate }),
    },
  });

  await cacheService.del(`user:${id}:data`);
  await cacheService.del(`user:profile:${id}`);

  return user;
}
