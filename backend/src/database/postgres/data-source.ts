import 'reflect-metadata';
import { MIGRATIONS } from 'src/database/postgres/migrations';
import { baseDataSourceOptions } from 'src/database/postgres/options';
import { DataSource } from 'typeorm';

/** Used by the TypeORM CLI (migration:run / revert / show) and the seed script. */
export const AppDataSource = new DataSource({
  ...baseDataSourceOptions(),
  migrations: MIGRATIONS,
});
