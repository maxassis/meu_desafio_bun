function getRequiredEnv(
  name:
    | "BETTER_AUTH_SECRET"
    | "BETTER_AUTH_URL"
    | "DATABASE_URL"
    | "GOOGLE_CLIENT_ID"
    | "GOOGLE_CLIENT_SECRET"
    | "EMAIL_HOST"
    | "EMAIL_PORT"
    | "EMAIL_USER"
    | "EMAIL_PASS"
    | "EMAIL_FROM",
) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getOptionalEnvFromList(name: "FRONTEND_URL" | "EXPO_SCHEME") {
  return process.env[name];
}

export const env = {
  betterAuthSecret: getRequiredEnv("BETTER_AUTH_SECRET"),
  betterAuthUrl: getRequiredEnv("BETTER_AUTH_URL"),
  databaseUrl: getRequiredEnv("DATABASE_URL"),
  googleClientId: getRequiredEnv("GOOGLE_CLIENT_ID"),
  googleClientSecret: getRequiredEnv("GOOGLE_CLIENT_SECRET"),
  frontendUrl: getOptionalEnvFromList("FRONTEND_URL"),
  expoScheme: getOptionalEnvFromList("EXPO_SCHEME"),
  emailHost: getRequiredEnv("EMAIL_HOST"),
  emailPort: Number(getRequiredEnv("EMAIL_PORT")),
  emailUser: getRequiredEnv("EMAIL_USER"),
  emailPass: getRequiredEnv("EMAIL_PASS"),
  emailFrom: getRequiredEnv("EMAIL_FROM"),
};
