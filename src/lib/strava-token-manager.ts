import { ENV } from 'varlock/env'

import { prisma } from '../shared/db/prisma'
import { decryptStravaToken, encryptStravaToken } from './strava-crypto'

const TOKEN_MARGIN_MS = 5 * 60 * 1000 // 5 minutos de margem

export async function getValidStravaToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: 'strava' },
  })

  if (!account?.accessToken || !account.refreshToken) {
    console.log('[StravaToken] No account found for user:', userId)
    return null
  }

  console.log('[StravaToken] Account found, expiresAt:', account.accessTokenExpiresAt)

  const expiresAt = account.accessTokenExpiresAt
  const isExpired
    = !expiresAt
      || expiresAt.getTime() < Date.now() + TOKEN_MARGIN_MS

  console.log('[StravaToken] Is expired:', isExpired)

  if (!isExpired) {
    console.log('[StravaToken] Using existing token')
    return decryptStravaToken(account.accessToken)
  }

  // Token expirado — fazer refresh
  const refreshToken = await decryptStravaToken(account.refreshToken)

  if (!refreshToken) {
    return null
  }

  if (!ENV.STRAVA_CLIENT_ID || !ENV.STRAVA_CLIENT_SECRET) {
    throw new Error('Strava client credentials not configured')
  }

  try {
    const params = new URLSearchParams({
      client_id: String(ENV.STRAVA_CLIENT_ID),
      client_secret: ENV.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    })

    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const data = await response.json() as {
      access_token?: string
      refresh_token?: string
      expires_at?: number
      token_type?: string
      scope?: string
      message?: string
    }

    if (!response.ok || !data.access_token) {
      throw new Error(
        `Strava refresh failed (${response.status}): ${data.message ?? JSON.stringify(data)}`,
      )
    }

    const newAccessToken = await encryptStravaToken(data.access_token)
    const newRefreshToken = data.refresh_token
      ? await encryptStravaToken(data.refresh_token)
      : account.refreshToken

    await prisma.account.update({
      where: { id: account.id },
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        accessTokenExpiresAt: data.expires_at
          ? new Date(data.expires_at * 1000)
          : undefined,
        scope: data.scope,
      },
    })

    return data.access_token
  }
  catch (error) {
    console.error('[Strava] Refresh error:', error)
    throw error
  }
}
