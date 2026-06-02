import { getValidStravaToken } from '../../../lib/strava-token-manager'

export async function testStravaToken(userId: string) {
  const token = await getValidStravaToken(userId)

  return {
    hasToken: !!token,
    tokenLength: token?.length ?? 0,
  }
}
