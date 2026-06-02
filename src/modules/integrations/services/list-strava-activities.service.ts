import { getValidStravaToken } from '../../../lib/strava-token-manager'
import { prisma } from '../../../shared/db/prisma'
import { DomainError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../../shared/errors'

interface StravaActivity {
  id?: number
  name?: string
  start_date?: string
  distance?: number
  calories?: number
  moving_time?: number
  elapsed_time?: number
  trainer?: boolean
}

export async function listStravaActivities(inscriptionId: number, userId: string) {
  console.log('[Strava] Activities request started')

  const inscription = await prisma.inscription.findFirst({
    where: {
      id: inscriptionId,
      userId,
    },
    select: {
      id: true,
      createdAt: true,
    },
  })

  if (!inscription) {
    throw new ForbiddenError('User is not registered for this challenge')
  }

  let accessToken: string | null
  try {
    console.log('[Strava] Getting valid token...')
    accessToken = await getValidStravaToken(userId)
    console.log('[Strava] Token obtained:', accessToken ? 'yes' : 'no')
  }
  catch (error) {
    console.error('[Strava] Token error:', error)
    throw new UnauthorizedError('Failed to refresh Strava token')
  }

  if (!accessToken) {
    throw new NotFoundError('Strava not connected')
  }

  console.log('[Strava] Fetching activities with token:', `${accessToken.substring(0, 20)}...`)
  const after = Math.floor(inscription.createdAt.getTime() / 1000)
  let response: Response

  try {
    response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=10&after=${after}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )
  }
  catch (error) {
    console.error('[Strava] Fetch error:', error)
    throw new DomainError('Failed to fetch from Strava', 502, 'STRAVA_FETCH_FAILED')
  }

  console.log('[Strava] Strava API response:', response.status)

  if (!response.ok) {
    throw new DomainError('Strava API error', 502, 'STRAVA_API_ERROR')
  }

  const importedTasks = await prisma.task.findMany({
    where: { inscriptionId, userId },
    select: { stravaActivityId: true },
  })

  const importedSet = new Set(
    importedTasks
      .map(t => t.stravaActivityId)
      .filter(id => id != null)
      .map(Number),
  )

  const activities = await response.json() as StravaActivity[]
  console.log('[Strava] Activities count:', activities?.length ?? 0)

  const pending = activities.filter((activity) => {
    if (importedSet.has(activity.id ?? 0)) {
      return false
    }

    if (!activity.start_date) {
      return false
    }

    return new Date(activity.start_date) >= inscription.createdAt
  })
  console.log('[Strava] Pending (not imported):', pending.length)

  return pending.map(activity => ({
    stravaActivityId: activity.id ?? 0,
    environment: activity.trainer ? 'esteira' : 'livre',
    name: activity.name ?? 'Atividade sem nome',
    date: activity.start_date ?? null,
    calories: typeof activity.calories === 'number' ? Math.round(activity.calories) : null,
    distance: Number(((activity.distance ?? 0) / 1000)),
    duration: activity.moving_time ?? activity.elapsed_time ?? 0,
  }))
}
