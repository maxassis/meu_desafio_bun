import { prisma } from '../../../shared/db/prisma'

export async function getStravaStatus(userId: string) {
  const stravaAccount = await prisma.account.findFirst({
    where: { userId, providerId: 'strava' },
  })

  return {
    connected: Boolean(stravaAccount),
    athleteId: stravaAccount?.accountId ?? null,
    scopes: stravaAccount?.scope ?? null,
    expiresAt: stravaAccount?.accessTokenExpiresAt ?? null,
  }
}
