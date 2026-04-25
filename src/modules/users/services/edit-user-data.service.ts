import { cacheService } from '../../../lib/cache/redis'
import { prisma } from '../../../shared/db/prisma'

export async function editUserData(id: string, data: {
  avatarFilename?: string | null
  bio?: string | null
  gender?: 'homem' | 'mulher' | 'nao_binario' | 'prefiro_nao_responder' | null
  sport?: 'corrida' | 'bicicleta' | null
  birthDate?: string | null
  name?: string
}) {
  const user = await prisma.$transaction(async (tx) => {
    const userDataUpdate = {
      ...(data.avatarFilename !== undefined && { avatarFilename: data.avatarFilename }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.gender !== undefined && { gender: data.gender }),
      ...(data.sport !== undefined && { sport: data.sport }),
      ...(data.birthDate !== undefined && { birthDate: data.birthDate }),
    }

    const [userData, userRecord] = await Promise.all([
      Object.keys(userDataUpdate).length > 0
        ? tx.userData.update({
            where: {
              userId: id,
            },
            data: userDataUpdate,
          })
        : tx.userData.findUnique({
            where: {
              userId: id,
            },
          }),
      data.name !== undefined
        ? tx.user.update({
            where: { id },
            data: { name: data.name },
          })
        : tx.user.findUnique({ where: { id } }),
    ])

    return {
      ...userData,
      full_name: userRecord?.name ?? null,
      username: userRecord?.name ?? null,
    }
  })

  await cacheService.del(`user:${id}:data`)
  await cacheService.del(`user:profile:${id}`)

  return user
}
