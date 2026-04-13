function getRequiredEnv(
  name: "BETTER_AUTH_SECRET" | "BETTER_AUTH_URL" | "DATABASE_URL",
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
};
