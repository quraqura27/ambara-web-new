export function getRuntimeDatabaseUrl(env: Record<string, string | undefined> = process.env) {
  const connectionString = env.NETLIFY_DATABASE_URL;
  if (!connectionString) {
    throw new Error('NETLIFY_DATABASE_URL is required for database access.');
  }

  return connectionString;
}
