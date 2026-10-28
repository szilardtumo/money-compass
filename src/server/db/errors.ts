import pg from 'postgres';

export const isPostgresError = (error: unknown): error is pg.PostgresError => {
  return !!(error as pg.PostgresError).schema_name;
};

export const isUniqueConstraintError = (error: unknown) => {
  // Drizzle wraps the driver's error in a DrizzleQueryError
  const cause = error instanceof Error && error.cause ? error.cause : error;
  return isPostgresError(cause) && cause.code === '23505';
};
