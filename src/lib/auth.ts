import { expo } from '@better-auth/expo'
import { prismaAdapter } from '@better-auth/prisma-adapter'
import { render, toPlainText } from '@react-email/render'
import { betterAuth } from 'better-auth'
import { emailOTP, openAPI } from 'better-auth/plugins'
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
