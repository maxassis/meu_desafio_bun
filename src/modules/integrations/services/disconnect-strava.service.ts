import { decryptStravaToken } from '../../../lib/strava-crypto'
import { prisma } from '../../../shared/db/prisma'
import { NotFoundError } from '../../../shared/errors'

export async function disconnectStrava(userId: string) {
  const stravaAccount = await prisma.account.findFirst({
    where: { userId, providerId: 'strava' },
  })

  if (!stravaAccount) {
    throw new NotFoundError('Strava not connected')
  }

  const accessToken = await decryptStravaToken(stravaAccount.accessToken)

  if (accessToken) {
    try {
      const response = await fetch('https://www.strava.com/oauth/deauthorize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        console.error('[Strava] Deauthorize failed:', response.status)
      }
    }
    catch (error) {
      console.error('[Strava] Deauthorize error:', error)
    }
  }

  await prisma.account.delete({
    where: { id: stravaAccount.id },
  })

  return {
    message: 'Strava disconnected successfully',
  }
}
