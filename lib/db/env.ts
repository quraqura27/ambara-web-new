export function getRuntimeDatabaseUrl(env: Record<string, string | undefined> = process.env) {
  const connectionString =
    env.NETLIFY_DATABASE_URL || env.NETLIFY_DATABASE_URL_UNPOOLED;
  if (!connectionString) {
    throw new Error(
      'NETLIFY_DATABASE_URL or NETLIFY_DATABASE_URL_UNPOOLED is required for database access.',
    );
  }

  return connectionString;
}
