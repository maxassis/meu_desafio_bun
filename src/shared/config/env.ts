import { z } from 'zod'

const requiredString = (name: string) =>
  z.string().trim().min(1, `${name} is required`)

const envSchema = z.object({
  BETTER_AUTH_SECRET: requiredString('BETTER_AUTH_SECRET'),
  BETTER_AUTH_URL: z.url({ error: 'BETTER_AUTH_URL must be a valid URL' }),
  DATABASE_URL: requiredString('DATABASE_URL'),
  GOOGLE_CLIENT_ID: requiredString('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: requiredString('GOOGLE_CLIENT_SECRET'),
  FRONTEND_URL: z.url({ error: 'FRONTEND_URL must be a valid URL' }),
  EXPO_SCHEME: requiredString('EXPO_SCHEME'),
  EMAIL_HOST: requiredString('EMAIL_HOST'),
  EMAIL_PORT: z.coerce
    .number({ error: 'EMAIL_PORT must be a valid number' })
    .int('EMAIL_PORT must be an integer')
    .positive('EMAIL_PORT must be greater than zero'),
  EMAIL_USER: requiredString('EMAIL_USER'),
  EMAIL_PASS: requiredString('EMAIL_PASS'),
  EMAIL_FROM: requiredString('EMAIL_FROM'),
  R2_ACCOUNT_ID: requiredString('R2_ACCOUNT_ID'),
  R2_ACCESS_KEY_ID: requiredString('R2_ACCESS_KEY_ID'),
  R2_SECRET_ACCESS_KEY: requiredString('R2_SECRET_ACCESS_KEY'),
  R2_PUBLIC_URL_AVATARS: z.url({ error: 'R2_PUBLIC_URL_AVATARS must be a valid URL' }).optional(),
  R2_PUBLIC_URL_DESAFIOS: z.url({ error: 'R2_PUBLIC_URL_DESAFIOS must be a valid URL' }),
  REDIS_HOST: requiredString('REDIS_HOST'),
  REDIS_PORT: z.coerce
    .number({ error: 'REDIS_PORT must be a valid number' })
    .int('REDIS_PORT must be an integer')
    .positive('REDIS_PORT must be greater than zero'),
  REDIS_PASSWORD: z.string().optional(),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues.map((issue) => {
    const path = issue.path.join('.') || 'env'
    return `- ${path}: ${issue.message}`
  })

  throw new Error(`Invalid environment variables:\n${issues.join('\n')}`)
}

export const env = {
  betterAuthSecret: parsedEnv.data.BETTER_AUTH_SECRET,
  betterAuthUrl: parsedEnv.data.BETTER_AUTH_URL,
  databaseUrl: parsedEnv.data.DATABASE_URL,
  googleClientId: parsedEnv.data.GOOGLE_CLIENT_ID,
  googleClientSecret: parsedEnv.data.GOOGLE_CLIENT_SECRET,
  frontendUrl: parsedEnv.data.FRONTEND_URL,
  expoScheme: parsedEnv.data.EXPO_SCHEME,
  emailHost: parsedEnv.data.EMAIL_HOST,
  emailPort: parsedEnv.data.EMAIL_PORT,
  emailUser: parsedEnv.data.EMAIL_USER,
  emailPass: parsedEnv.data.EMAIL_PASS,
  emailFrom: parsedEnv.data.EMAIL_FROM,
  r2AccountId: parsedEnv.data.R2_ACCOUNT_ID,
  r2AccessKeyId: parsedEnv.data.R2_ACCESS_KEY_ID,
  r2SecretAccessKey: parsedEnv.data.R2_SECRET_ACCESS_KEY,
  r2PublicUrlAvatars: parsedEnv.data.R2_PUBLIC_URL_AVATARS,
  r2PublicUrlDesafios: parsedEnv.data.R2_PUBLIC_URL_DESAFIOS,
  redisHost: parsedEnv.data.REDIS_HOST,
  redisPassword: parsedEnv.data.REDIS_PASSWORD,
  redisPort: parsedEnv.data.REDIS_PORT,
}
