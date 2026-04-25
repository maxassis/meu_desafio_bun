import { expo } from '@better-auth/expo'
import { prismaAdapter } from '@better-auth/prisma-adapter'
import { render, toPlainText } from '@react-email/render'
import { betterAuth } from 'better-auth'
import { bearer, emailOTP, jwt, openAPI } from 'better-auth/plugins'
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
      .map((url) => new URL(url).host)
      .filter((host) => host.length > 0),
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
    bearer({ requireSignature: true }),
    jwt(),
    openAPI(),
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
