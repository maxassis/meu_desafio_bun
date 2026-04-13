import { prismaAdapter } from "@better-auth/prisma-adapter";
import { render, toPlainText } from "@react-email/render";
import { betterAuth } from "better-auth";
import { bearer, emailOTP, jwt, openAPI } from "better-auth/plugins";
import { createElement } from "react";

import { sendEmail } from "./email";
import {
  EmailVerificationOtpEmail,
  emailVerificationOtpSubject,
} from "./email/templates/email-verification-otp-email";
import { env } from "../shared/config/env";
import { prisma } from "../shared/db/prisma";

const emailVerificationOtpExpiresInSeconds = 300;

export const auth = betterAuth({
  secret: env.betterAuthSecret,
  baseURL: env.betterAuthUrl,
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
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
    bearer({ requireSignature: true }),
    jwt(),
    openAPI(),
    emailOTP({
      allowedAttempts: 3,
      expiresIn: emailVerificationOtpExpiresInSeconds,
      otpLength: 5,
      overrideDefaultEmailVerification: true,
      resendStrategy: "reuse",
      async sendVerificationOTP({ email, otp, type }) {
        if (type !== "email-verification") {
          return;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: { name: true },
        });

        const html = await render(
          createElement(EmailVerificationOtpEmail, {
            expiresInMinutes: Math.ceil(emailVerificationOtpExpiresInSeconds / 60),
            name: user?.name ?? "",
            otp,
          }),
        );

        await sendEmail({
          to: email,
          subject: emailVerificationOtpSubject,
          text: toPlainText(html),
          html,
        });
      },
    }),
  ],
});

let schemaPromise: ReturnType<typeof auth.api.generateOpenAPISchema> | undefined;

function getAuthOpenAPISchema() {
  if (!schemaPromise) {
    schemaPromise = auth.api.generateOpenAPISchema();
  }

  return schemaPromise;
}

export const authOpenAPI = {
  getPaths: async (prefix = "/api/auth") => {
    const { paths } = await getAuthOpenAPISchema();
    const reference: Record<string, (typeof paths)[string]> = Object.create(null);

    for (const path of Object.keys(paths)) {
      const key = `${prefix}${path}`;
      reference[key] = paths[path];

      for (const method of Object.keys(paths[path])) {
        const operation = reference[key][method as keyof (typeof paths)[string]] as {
          tags?: string[];
        };

        operation.tags = ["Better Auth"];
      }
    }

    return reference;
  },
  components: getAuthOpenAPISchema().then(({ components }) => components) as Promise<any>,
} as const;
