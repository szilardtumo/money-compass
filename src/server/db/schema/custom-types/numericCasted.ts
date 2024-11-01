import { customType } from 'drizzle-orm/pg-core';

type NumericConfig = {
  precision?: number;
  scale?: number;
};

export const numericCasted = customType<{
  data: number;
  driverData: string;
  config: NumericConfig;
}>({
  dataType: (config) => `numeric(${config?.precision ?? 65}, ${config?.scale ?? 30})`,
  fromDriver: (value): number => Number(value),
  toDriver: (value): string => value.toString(),
});
