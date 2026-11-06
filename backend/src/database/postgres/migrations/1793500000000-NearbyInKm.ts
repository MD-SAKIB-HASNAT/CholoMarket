import type { MigrationInterface, QueryRunner } from 'typeorm';

/** The nearby radius setting is now kept in kilometres (it was metres). */
export class NearbyInKm1793500000000 implements MigrationInterface {
  name = 'NearbyInKm1793500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "platform_settings"
         SET "key" = 'nearby_max_km', "value" = to_jsonb(round(("value"#>>'{}')::numeric / 1000, 3))
       WHERE "key" = 'nearby_max_meters'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "platform_settings"
         SET "key" = 'nearby_max_meters', "value" = to_jsonb(round(("value"#>>'{}')::numeric * 1000))
       WHERE "key" = 'nearby_max_km'`,
    );
  }
}
