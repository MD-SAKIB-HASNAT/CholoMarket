import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Things TypeORM decorators can't express:
 *  - pg_trgm + trigram GIN indexes for fuzzy Bangla/English name search
 *  - GIN index on products.search_vector (full-text)
 *  - expression unique indexes (lower(email), one review per order+product)
 *  - helper views (mall walk-through directory, shop balances)
 */
export class SearchIndexesAndViews1792695205908 implements MigrationInterface {
  name = 'SearchIndexesAndViews1792695205908';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    await queryRunner.query(
      `CREATE INDEX "IDX_markets_name_trgm" ON "markets" USING gin (("name_en" || ' ' || "name_bn") gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_shops_name_trgm" ON "shops" USING gin (("name_en" || ' ' || coalesce("name_bn", '')) gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_name_trgm" ON "products" USING gin (("name_en" || ' ' || coalesce("name_bn", '')) gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_search_vector" ON "products" USING gin ("search_vector")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_product_variants_attributes" ON "product_variants" USING gin ("attributes")`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_users_email_lower" ON "users" (lower("email")) WHERE "email" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_reviews_one_per_target" ON "reviews" ("shop_order_id", coalesce("product_id", 0))`,
    );

    await queryRunner.query(`
      CREATE VIEW "v_market_directory" AS
      SELECT s."market_id", f."level" AS "floor_level", f."name_en" AS "floor_name",
             s."walk_order", s."id" AS "shop_id", s."slug", s."name_en", s."name_bn", s."shop_number",
             s."logo_url", s."is_verified", s."rating_avg", s."map_x", s."map_y"
      FROM "shops" s
      LEFT JOIN "market_floors" f ON f."id" = s."floor_id"
      WHERE s."status" = 'active' AND s."deleted_at" IS NULL`);

    await queryRunner.query(`
      CREATE VIEW "v_shop_balance" AS
      SELECT "shop_id", SUM("amount")::numeric(12,2) AS "balance", MAX("created_at") AS "last_entry_at"
      FROM "shop_ledger_entries"
      GROUP BY "shop_id"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW IF EXISTS "v_shop_balance"`);
    await queryRunner.query(`DROP VIEW IF EXISTS "v_market_directory"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_reviews_one_per_target"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_email_lower"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_product_variants_attributes"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_products_search_vector"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_name_trgm"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_shops_name_trgm"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_markets_name_trgm"`);
  }
}
