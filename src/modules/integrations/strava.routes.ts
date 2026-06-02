import { Elysia } from 'elysia'

import { getRequiredSession } from '../auth/auth.middleware'
import { ListStravaActivitiesQuerySchema } from './schema'
import { disconnectStrava, getStravaStatus, listStravaActivities, testStravaToken } from './services'

export const stravaRoutes = new Elysia({ prefix: '/integrations/strava' })
  .get('/activities', async ({ query, request }) => {
    const session = await getRequiredSession(request)

    return listStravaActivities(query.inscriptionId, session.user.id)
  }, {
    query: ListStravaActivitiesQuerySchema,
    detail: {
      tags: ['Integrations'],
      summary: 'List Strava activities for authenticated user',
    },
  })
  .get('/test-token', async ({ request }) => {
    const session = await getRequiredSession(request)

    return testStravaToken(session.user.id)
  })
  .get('/status', async ({ request }) => {
    const session = await getRequiredSession(request)

    return getStravaStatus(session.user.id)
  }, {
    detail: {
      tags: ['Integrations'],
      summary: 'Check Strava connection status',
    },
  })
  .delete('/', async ({ request }) => {
    const session = await getRequiredSession(request)

    return disconnectStrava(session.user.id)
  }, {
    detail: {
      tags: ['Integrations'],
      summary: 'Disconnect Strava account for authenticated user',
    },
  })
