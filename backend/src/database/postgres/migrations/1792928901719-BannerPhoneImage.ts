import type { MigrationInterface, QueryRunner } from 'typeorm';

export class BannerPhoneImage1792928901719 implements MigrationInterface {
  name = 'BannerPhoneImage1792928901719';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ad_campaigns" ADD "mobile_image_url" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_campaigns" ADD "image_has_text" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ad_campaigns" DROP COLUMN "image_has_text"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_campaigns" DROP COLUMN "mobile_image_url"`,
    );
  }
}
