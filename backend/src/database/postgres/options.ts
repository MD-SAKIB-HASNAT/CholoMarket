import { ENTITIES } from 'src/database/postgres/entities';
import { SnakeNamingStrategy } from 'src/database/postgres/snake-naming.strategy';
import type { DataSourceOptions } from 'typeorm';

export function baseDataSourceOptions(
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5440),
    username: env.DB_USER ?? 'cholo',
    password: env.DB_PASSWORD ?? 'cholo_dev_password',
    database: env.DB_NAME ?? 'cholo_market',
    entities: ENTITIES,
    namingStrategy: new SnakeNamingStrategy(),
    // Schema changes only ever go through migrations.
    synchronize: false,
    logging: env.DB_LOGGING === 'true' ? ['query', 'error'] : ['error'],
  };
}
