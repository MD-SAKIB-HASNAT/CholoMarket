import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ENTITIES } from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';

/** Registers every entity once and exposes the PostgresService to all modules. */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature(ENTITIES)],
  providers: [PostgresService],
  exports: [PostgresService],
})
export class PostgresModule {}
