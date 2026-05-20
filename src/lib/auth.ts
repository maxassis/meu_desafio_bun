import { expo } from '@better-auth/expo'
import { prismaAdapter } from '@better-auth/prisma-adapter'
import { render, toPlainText } from '@react-email/render'
import { betterAuth } from 'better-auth'
import { emailOTP, genericOAuth, openAPI } from 'better-auth/plugins'
import { createElement } from 'react'

import { ENV } from 'varlock/env'
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

const authAllowedHosts = Array.from(
  new Set(
    [ENV.BETTER_AUTH_URL]
      .map(url => new URL(url).host)
      .filter(host => host.length > 0),
  ),
)

const expoTrustedOrigins = ENV.EXPO_SCHEME
  ? [
      `${ENV.EXPO_SCHEME}://`,
      `${ENV.EXPO_SCHEME}://strava-connected`,
      `${ENV.EXPO_SCHEME}://*`,
      `${ENV.EXPO_SCHEME}://**`,
    ]
  : []

const trustedOrigins = Array.from(
  new Set(
    [ENV.FRONTEND_URL, ENV.BETTER_AUTH_URL, ...expoTrustedOrigins].filter(
      (origin): origin is string => Boolean(origin),
    ),
  ),
)

export const auth = betterAuth({
  secret: ENV.BETTER_AUTH_SECRET,
  baseURL: {
    allowedHosts: authAllowedHosts,
    fallback: ENV.BETTER_AUTH_URL,
    protocol: 'auto',
  },
  trustedOrigins: trustedOrigins.length > 0 ? trustedOrigins : undefined,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  account: {
    encryptOAuthTokens: true,
    storeStateStrategy: 'database',
    skipStateCookieCheck: true,
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
      clientId: ENV.GOOGLE_CLIENT_ID,
      clientSecret: ENV.GOOGLE_CLIENT_SECRET,
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
    ...(ENV.STRAVA_CLIENT_ID && ENV.STRAVA_CLIENT_SECRET
      ? [
          genericOAuth({
            config: [
              {
                providerId: 'strava',
                clientId: String(ENV.STRAVA_CLIENT_ID),
                clientSecret: ENV.STRAVA_CLIENT_SECRET,
                authorizationUrl: 'https://www.strava.com/oauth/authorize',
                tokenUrl: 'https://www.strava.com/oauth/token',
                scopes: ['read', 'activity:read_all'],
                authentication: 'post',
                disableSignUp: true,
                async getToken({ code, redirectURI }) {
                  if (!ENV.STRAVA_CLIENT_ID || !ENV.STRAVA_CLIENT_SECRET) {
                    throw new Error('Strava OAuth is not configured.')
                  }

                  const clientId = String(ENV.STRAVA_CLIENT_ID)
                  const clientSecret = ENV.STRAVA_CLIENT_SECRET

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
