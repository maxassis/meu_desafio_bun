import { PrismaPg } from '@prisma/adapter-pg'

import { ENV } from 'varlock/env'
import { PrismaClient } from '../../generated/prisma/client'

const adapter = new PrismaPg({ connectionString: ENV.DATABASE_URL })

export const prisma = new PrismaClient({ adapter })
