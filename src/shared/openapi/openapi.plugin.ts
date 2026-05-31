import { openapi } from '@elysiajs/openapi'

import { authOpenAPI } from '../../lib/auth'

export const openapiPlugin = openapi({
  path: '/openapi',
  documentation: {
    info: {
      title: 'Meu Desafio Bun API',
      version: '1.0.50',
    },
    tags: [
      { name: 'Better Auth', description: 'Native Better Auth routes' },
      { name: 'Desafio', description: 'Challenge operations' },
      { name: 'Integrations', description: 'External service integrations' },
      { name: 'Users', description: 'User operations' },
      { name: 'Tasks', description: 'Task operations' },
    ],
    components: (await authOpenAPI.components) as any,
    paths: (await authOpenAPI.getPaths('/api/auth')) as any,
  },
})
