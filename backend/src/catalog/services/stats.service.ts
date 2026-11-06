import { Injectable } from '@nestjs/common';
import { PostgresService } from 'src/database/postgres/postgres.service';

/** Headline numbers for the home page. Lists are cursor-paged and carry no totals, so counts live here. */
@Injectable()
export class StatsService {
  constructor(private readonly postgresService: PostgresService) {}

  async counts() {
    const [row] = await this.postgresService.dataSource.query<
      { markets: number; shops: number; products: number }[]
    >(
      `SELECT (SELECT count(*) FROM markets WHERE status = 'active')::int AS markets,
              (SELECT count(*) FROM shops WHERE status = 'active')::int AS shops,
              (SELECT count(*) FROM products WHERE status = 'active' AND deleted_at IS NULL)::int AS products`,
    );
    return row;
  }
}
