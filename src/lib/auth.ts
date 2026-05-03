import { expo } from '@better-auth/expo'
import { prismaAdapter } from '@better-auth/prisma-adapter'
import { render, toPlainText } from '@react-email/render'
import { betterAuth } from 'better-auth'
import { emailOTP, genericOAuth, openAPI } from 'better-auth/plugins'
import { createElement } from 'react'

import { env } from '../shared/config/env'
import { prisma } from '../shared/db/prisma'
import { sendEmail } from './email'
import {
  EmailVerificationOtpEmail,
  emailVerificationOtpSubject,
} from './email/templates/email-verification-otp-email'
import {
  ResetPasswordOtpEmail,
  resetPasswordOtpSubject,
} from './email/templates/reset-password-otp-email'

const emailVerificationOtpExpiresInSeconds = 300

const authDevBaseUrls = ['http://localhost:3000', 'http://127.0.0.1:3000']
const authProductionBaseUrls = ['https://teste.maxdev.sbs']

const authAllowedHosts = Array.from(
  new Set(
    [env.betterAuthUrl, ...authProductionBaseUrls, ...authDevBaseUrls]
      .map(url => new URL(url).host)
      .filter(host => host.length > 0),
  ),
)

const expoTrustedOrigins = env.expoScheme
  ? [
      `${env.expoScheme}://`,
      `${env.expoScheme}://*`,
      `${env.expoScheme}://**`,
    ]
  : []

const devOrigins = [
  'http://localhost:3000',
  'http://localhost:5500',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:5173',
]

const trustedOrigins = Array.from(
  new Set(
    ['https://teste.maxdev.sbs', env.frontendUrl, env.betterAuthUrl, ...devOrigins, ...expoTrustedOrigins].filter(
      (origin): origin is string => Boolean(origin),
    ),
  ),
)

export const auth = betterAuth({
  secret: env.betterAuthSecret,
  baseURL: {
    allowedHosts: authAllowedHosts,
    fallback: env.betterAuthUrl,
    protocol: 'auto',
  },
  trustedOrigins: trustedOrigins.length > 0 ? trustedOrigins : undefined,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  account: {
    encryptOAuthTokens: true,
    storeStateStrategy: 'cookie',
    accountLinking: {
      enabled: true,
      disableImplicitLinking: true,
      allowDifferentEmails: true,
    },
  },
  databaseHooks: {
    user: {
      create: {
        async after(user) {
          await prisma.userData.upsert({
            where: { userId: user.id },
            update: {},
            create: { userId: user.id },
          })
        },
      },
    },
  },
  socialProviders: {
    google: {
      clientId: env.googleClientId,
      clientSecret: env.googleClientSecret,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },
  plugins: [
    expo(),
    openAPI(),
    ...(env.stravaClientId && env.stravaClientSecret
      ? [
          genericOAuth({
            config: [
              {
                providerId: 'strava',
                clientId: env.stravaClientId,
                clientSecret: env.stravaClientSecret,
                authorizationUrl: 'https://www.strava.com/oauth/authorize',
                tokenUrl: 'https://www.strava.com/oauth/token',
                scopes: ['read', 'activity:read_all'],
                authentication: 'post',
                disableSignUp: true,
                async getToken({ code, redirectURI }) {
                  if (!env.stravaClientId || !env.stravaClientSecret) {
                    throw new Error('Strava OAuth is not configured.')
                  }

                  const clientId = env.stravaClientId
                  const clientSecret = env.stravaClientSecret

                  const params = new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: redirectURI,
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
                    athlete?: {
                      id: number
                      firstname?: string
                      lastname?: string
                      profile?: string
                    }
                  }

                  if (!response.ok || !data.access_token) {
                    throw new Error(
                      `Strava token error (${response.status}): ${JSON.stringify(data)} | redirectURI=${redirectURI}`,
                    )
                  }

                  return {
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    accessTokenExpiresAt: data.expires_at ? new Date(data.expires_at * 1000) : undefined,
                    tokenType: data.token_type,
                    scopes: data.scope
                      ? data.scope.split(',').map(scope => scope.trim()).filter(Boolean)
                      : undefined,
                    raw: data,
                  }
                },
                async getUserInfo(tokens) {
                  const athlete = tokens.raw?.athlete as {
                    id: number
                    firstname?: string
                    lastname?: string
                    profile?: string
                  } | undefined

                  if (!athlete) {
                    return null
                  }

                  const fullName = [athlete.firstname, athlete.lastname].filter(Boolean).join(' ').trim()

                  return {
                    id: String(athlete.id),
                    email: `strava-${athlete.id}@strava.local`,
                    emailVerified: false,
                    name: fullName.length > 0 ? fullName : `Strava ${athlete.id}`,
                    image: athlete.profile,
                  }
                },
              },
            ],
          }),
        ]
      : []),
    emailOTP({
      allowedAttempts: 3,
      expiresIn: emailVerificationOtpExpiresInSeconds,
      otpLength: 5,
      overrideDefaultEmailVerification: true,
      resendStrategy: 'reuse',
      async sendVerificationOTP({ email, otp, type }) {
        if (type !== 'email-verification' && type !== 'forget-password') {
          return
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: { name: true },
        })

        const html = await render(
          createElement(
            type === 'email-verification' ? EmailVerificationOtpEmail : ResetPasswordOtpEmail,
            {
              expiresInMinutes: Math.ceil(emailVerificationOtpExpiresInSeconds / 60),
              name: user?.name ?? 'atleta',
              otp,
            },
          ),
        )

        await sendEmail({
          to: email,
          subject: type === 'email-verification' ? emailVerificationOtpSubject : resetPasswordOtpSubject,
          text: toPlainText(html),
          html,
        })
      },
    }),
  ],
})

let schemaPromise: ReturnType<typeof auth.api.generateOpenAPISchema> | undefined

function getAuthOpenAPISchema() {
  if (!schemaPromise) {
    schemaPromise = auth.api.generateOpenAPISchema()
  }

  return schemaPromise
}

export const authOpenAPI = {
  getPaths: async (prefix = '/api/auth') => {
    const { paths } = await getAuthOpenAPISchema()
    const reference: Record<string, (typeof paths)[string]> = Object.create(null)

    for (const path of Object.keys(paths)) {
      const key = `${prefix}${path}`
      reference[key] = paths[path]

      for (const method of Object.keys(paths[path])) {
        const operation = reference[key][method as keyof (typeof paths)[string]] as {
          tags?: string[]
        }

        operation.tags = ['Better Auth']
      }
    }

    return reference
  },
  components: getAuthOpenAPISchema().then(({ components }) => components) as Promise<any>,
} as const
