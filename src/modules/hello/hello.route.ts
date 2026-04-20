import { createProtectedRoutes } from '../auth/auth.middleware'
import { getHelloWorld } from './hello.service'

export const helloRoutes = createProtectedRoutes('hello-auth-guard').get('/', () =>
  getHelloWorld())
