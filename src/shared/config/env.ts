function getRequiredEnv(
  name:
    | "BETTER_AUTH_SECRET"
    | "BETTER_AUTH_URL"
    | "DATABASE_URL"
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

export const env = {
  betterAuthSecret: getRequiredEnv("BETTER_AUTH_SECRET"),
  betterAuthUrl: getRequiredEnv("BETTER_AUTH_URL"),
  databaseUrl: getRequiredEnv("DATABASE_URL"),
  emailHost: getRequiredEnv("EMAIL_HOST"),
  emailPort: Number(getRequiredEnv("EMAIL_PORT")),
  emailUser: getRequiredEnv("EMAIL_USER"),
  emailPass: getRequiredEnv("EMAIL_PASS"),
  emailFrom: getRequiredEnv("EMAIL_FROM"),
};
