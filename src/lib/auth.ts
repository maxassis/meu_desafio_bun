import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { bearer, jwt, openAPI } from "better-auth/plugins";

import { sendEmail } from "./email";
import { env } from "../shared/config/env";
import { prisma } from "../shared/db/prisma";

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
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Confirme seu e-mail",
        text: `Clique no link para confirmar seu cadastro: ${url}`,
        html: `<p>Clique no link para confirmar seu cadastro:</p><p><a href="${url}">${url}</a></p>`,
      });
    },
  },
  plugins: [bearer({ requireSignature: true }), jwt(), openAPI()],
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
