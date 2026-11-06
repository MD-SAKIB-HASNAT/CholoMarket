import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CategoryImagesAndBanners1792764924452 implements MigrationInterface {
  name = 'CategoryImagesAndBanners1792764924452';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" ADD "image_url" text`);
    await queryRunner.query(`ALTER TABLE "ad_campaigns" ADD "subtitle" text`);
    await queryRunner.query(`ALTER TABLE "ad_campaigns" ADD "link_url" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ad_campaigns" DROP COLUMN "link_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_campaigns" DROP COLUMN "subtitle"`,
    );
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "image_url"`);
  }
}
