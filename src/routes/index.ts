import { Elysia } from 'elysia'

import { authPlugin } from '../modules/auth/auth.plugin'
import { desafioRoutes } from '../modules/desafio/desafio.routes'
import { stravaRoutes } from '../modules/integrations/strava.routes'
import { taskRoutes } from '../modules/task/task.routes'
import { usersRoutes } from '../modules/users/users.routes'

export const routes = new Elysia()
  .use(authPlugin)
  .use(desafioRoutes)
  .use(stravaRoutes)
  .use(usersRoutes)
  .use(taskRoutes)
