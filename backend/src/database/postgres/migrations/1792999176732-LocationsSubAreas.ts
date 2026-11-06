import type { MigrationInterface, QueryRunner } from 'typeorm';

export class LocationsSubAreas1792999176732 implements MigrationInterface {
  name = 'LocationsSubAreas1792999176732';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "sub_areas" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "area_id" integer NOT NULL, "name_en" text NOT NULL, "name_bn" text NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_12a493888226fce012d349568b4" UNIQUE ("area_id", "name_en"), CONSTRAINT "PK_acf3fea896b6df1bd20dd5ff732" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "divisions" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "districts" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "areas" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(`ALTER TABLE "markets" ADD "sub_area_id" integer`);
    await queryRunner.query(
      `CREATE INDEX "IDX_80d9c5ca8bc7d969381f588d96" ON "markets"  ("sub_area_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_areas" ADD CONSTRAINT "FK_1f492fee4187f745f580323c62a" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "markets" ADD CONSTRAINT "FK_80d9c5ca8bc7d969381f588d960" FOREIGN KEY ("sub_area_id") REFERENCES "sub_areas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "markets" DROP CONSTRAINT "FK_80d9c5ca8bc7d969381f588d960"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_areas" DROP CONSTRAINT "FK_1f492fee4187f745f580323c62a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_80d9c5ca8bc7d969381f588d96"`,
    );
    await queryRunner.query(`ALTER TABLE "markets" DROP COLUMN "sub_area_id"`);
    await queryRunner.query(`ALTER TABLE "areas" DROP COLUMN "is_active"`);
    await queryRunner.query(`ALTER TABLE "districts" DROP COLUMN "is_active"`);
    await queryRunner.query(`ALTER TABLE "divisions" DROP COLUMN "is_active"`);
    await queryRunner.query(`DROP TABLE "sub_areas"`);
  }
}
