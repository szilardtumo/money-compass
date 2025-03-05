import pg from 'postgres';

export const isPostgresError = (error: unknown): error is pg.PostgresError => {
  return !!(error as pg.PostgresError).schema_name;
};

export const isUniqueConstraintError = (error: unknown): error is pg.PostgresError => {
  return isPostgresError(error) && error.code === '23505';
};
