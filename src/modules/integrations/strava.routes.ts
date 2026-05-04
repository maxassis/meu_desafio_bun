import { Elysia } from 'elysia'

import { getValidStravaToken } from '../../lib/strava-token-manager'
import { prisma } from '../../shared/db/prisma'
import { resolveSession } from '../auth/auth.middleware'

export const stravaRoutes = new Elysia({ prefix: '/integrations/strava' })
  .get('/activities', async ({ request }) => {
    console.log('[Strava] Activities request started')

    const session = await resolveSession(request)
    console.log('[Strava] Session:', session?.user?.id ? 'found' : 'not found')

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let accessToken: string | null
    try {
      console.log('[Strava] Getting valid token...')
      accessToken = await getValidStravaToken(session.user.id)
      console.log('[Strava] Token obtained:', accessToken ? 'yes' : 'no')
    }
    catch (error) {
      console.error('[Strava] Token error:', error)
      return new Response(
        JSON.stringify({
          message: 'Failed to refresh Strava token',
          error: error instanceof Error ? error.message : String(error),
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } },
      )
    }

    if (!accessToken) {
      return new Response(
        JSON.stringify({ message: 'Strava not connected' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }

    try {
      console.log('[Strava] Fetching activities with token:', `${accessToken.substring(0, 20)}...`)
      const response = await fetch(
        'https://www.strava.com/api/v3/athlete/activities?per_page=10',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )
      console.log('[Strava] Strava API response:', response.status)

      if (!response.ok) {
        return new Response(
          JSON.stringify({
            message: 'Strava API error',
            status: response.status,
          }),
          { status: 502, headers: { 'Content-Type': 'application/json' } },
        )
      }

      const activities = await response.json()
      console.log('[Strava] Activities count:', activities?.length ?? 0)

      return activities
    }
    catch (fetchError) {
      console.error('[Strava] Fetch error:', fetchError)
      return new Response(
        JSON.stringify({
          message: 'Failed to fetch from Strava',
          error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      )
    }
  }, {
    detail: {
      tags: ['Integrations'],
      summary: 'List Strava activities for authenticated user',
    },
  })
  .get('/test-token', async ({ request }) => {
    const session = await resolveSession(request)

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    try {
      const token = await getValidStravaToken(session.user.id)
      return {
        hasToken: !!token,
        tokenLength: token?.length ?? 0,
      }
    }
    catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }
  })
  .get('/status', async ({ request }) => {
    const session = await resolveSession(request)

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const stravaAccount = await prisma.account.findFirst({
      where: { userId: session.user.id, providerId: 'strava' },
    })

    return {
      connected: Boolean(stravaAccount),
      athleteId: stravaAccount?.accountId ?? null,
      scopes: stravaAccount?.scope ?? null,
      expiresAt: stravaAccount?.accessTokenExpiresAt ?? null,
    }
  }, {
    detail: {
      tags: ['Integrations'],
      summary: 'Check Strava connection status',
    },
  })
