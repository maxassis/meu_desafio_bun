import { prisma } from '../../../shared/db/prisma'

export async function checkEmailExists(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  return { exists: !!user }
}
