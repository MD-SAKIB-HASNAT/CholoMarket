import type { MigrationInterface, QueryRunner } from 'typeorm';

export class HomeDeliveryAndCouriers1792769940290 implements MigrationInterface {
  name = 'HomeDeliveryAndCouriers1792769940290';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "courier_accounts" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "shop_id" integer NOT NULL, "provider" character varying(20) NOT NULL, "mode" character varying(10) NOT NULL DEFAULT 'mock', "label" text NOT NULL, "api_key" text, "secret_key" text, "key_hint" character varying(8), "is_default" boolean NOT NULL DEFAULT true, "is_active" boolean NOT NULL DEFAULT true, "last_checked_at" TIMESTAMP WITH TIME ZONE, "last_error" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_courier_accounts_mode" CHECK ("mode" IN ('mock', 'live')), CONSTRAINT "CHK_courier_accounts_provider" CHECK ("provider" IN ('steadfast')), CONSTRAINT "PK_287734c20c62a82f7a0a3b3aeb0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_654faec719fb531dac16c62b4d" ON "courier_accounts"  ("shop_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_courier_accounts_one_default" ON "courier_accounts"  ("shop_id", "provider") WHERE "is_default"`,
    );
    await queryRunner.query(
      `CREATE TABLE "shipments" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "shop_order_id" integer NOT NULL, "shop_id" integer NOT NULL, "courier_account_id" integer NOT NULL, "provider" character varying(20) NOT NULL, "invoice" text NOT NULL, "consignment_id" text NOT NULL, "tracking_code" text, "status" character varying(20) NOT NULL DEFAULT 'booked', "courier_status" text, "cod_amount" numeric(12,2) NOT NULL DEFAULT '0', "courier_charge" numeric(12,2), "recipient" jsonb NOT NULL, "note" text, "created_by" integer, "delivered_at" TIMESTAMP WITH TIME ZONE, "last_synced_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_1bc7567c4db8243316fc9ba7faa" UNIQUE ("shop_order_id"), CONSTRAINT "REL_1bc7567c4db8243316fc9ba7fa" UNIQUE ("shop_order_id"), CONSTRAINT "CHK_shipments_status" CHECK ("status" IN ('booked', 'in_transit', 'on_hold', 'delivered', 'partial_delivered', 'returned', 'cancelled')), CONSTRAINT "CHK_shipments_provider" CHECK ("provider" IN ('steadfast')), CONSTRAINT "PK_6deda4532ac542a93eab214b564" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_de1ce7c6c89898be769ff553b0" ON "shipments"  ("shop_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6a19baf6dd62cac42fbb40a518" ON "shipments"  ("status") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a9e218003af0837206a392118e" ON "shipments"  ("provider", "consignment_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "shipment_events" ("id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL, "shipment_id" integer NOT NULL, "status" character varying(20) NOT NULL, "courier_status" text, "source" character varying(10) NOT NULL, "message" text, "raw" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_80a42a8d00d59cbfab38e1d0872" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bf62e73eecc6aef7c7f63885df" ON "shipment_events"  ("shipment_id", "created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" ADD "district" text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" ADD "area_name" text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" ADD "zone" character varying(20) NOT NULL DEFAULT 'inside_dhaka'`,
    );
    await queryRunner.query(
      `ALTER TABLE "shops" ADD "offers_delivery" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_orders" ADD "delivery_fee" numeric(12,2) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_orders" ADD "shipped_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" DROP CONSTRAINT "FK_3c9b4d155e1f5cc98d6b7063050"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" ALTER COLUMN "area_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" ADD CONSTRAINT "CHK_user_addresses_zone" CHECK ("zone" IN ('inside_dhaka', 'outside_dhaka'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" ADD CONSTRAINT "FK_3c9b4d155e1f5cc98d6b7063050" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "courier_accounts" ADD CONSTRAINT "FK_654faec719fb531dac16c62b4df" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipments" ADD CONSTRAINT "FK_1bc7567c4db8243316fc9ba7faa" FOREIGN KEY ("shop_order_id") REFERENCES "shop_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipments" ADD CONSTRAINT "FK_59cff4c973cb4482206301e6769" FOREIGN KEY ("courier_account_id") REFERENCES "courier_accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipments" ADD CONSTRAINT "FK_111f29a3517f16391665bf47ac0" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipment_events" ADD CONSTRAINT "FK_7550a4aa8c7fe2d64f6c71d7da1" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    // TypeORM does not diff CHECK bodies: widen the shop-order states for courier delivery.
    await queryRunner.query(
      `ALTER TABLE "shop_orders" DROP CONSTRAINT "CHK_shop_orders_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_orders" ADD CONSTRAINT "CHK_shop_orders_status" CHECK ("status" IN ('placed', 'confirmed', 'ready_for_pickup', 'shipped', 'handed_to_rider', 'out_for_delivery', 'completed', 'rejected', 'cancelled', 'expired', 'returned'))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "shop_orders" DROP CONSTRAINT "CHK_shop_orders_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_orders" ADD CONSTRAINT "CHK_shop_orders_status" CHECK ("status" IN ('placed', 'confirmed', 'ready_for_pickup', 'handed_to_rider', 'out_for_delivery', 'completed', 'rejected', 'cancelled', 'expired'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipment_events" DROP CONSTRAINT "FK_7550a4aa8c7fe2d64f6c71d7da1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipments" DROP CONSTRAINT "FK_111f29a3517f16391665bf47ac0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipments" DROP CONSTRAINT "FK_59cff4c973cb4482206301e6769"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipments" DROP CONSTRAINT "FK_1bc7567c4db8243316fc9ba7faa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "courier_accounts" DROP CONSTRAINT "FK_654faec719fb531dac16c62b4df"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" DROP CONSTRAINT "FK_3c9b4d155e1f5cc98d6b7063050"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" DROP CONSTRAINT "CHK_user_addresses_zone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" ALTER COLUMN "area_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" ADD CONSTRAINT "FK_3c9b4d155e1f5cc98d6b7063050" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_orders" DROP COLUMN "shipped_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_orders" DROP COLUMN "delivery_fee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shops" DROP COLUMN "offers_delivery"`,
    );
    await queryRunner.query(`ALTER TABLE "user_addresses" DROP COLUMN "zone"`);
    await queryRunner.query(
      `ALTER TABLE "user_addresses" DROP COLUMN "area_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" DROP COLUMN "district"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bf62e73eecc6aef7c7f63885df"`,
    );
    await queryRunner.query(`DROP TABLE "shipment_events"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a9e218003af0837206a392118e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6a19baf6dd62cac42fbb40a518"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_de1ce7c6c89898be769ff553b0"`,
    );
    await queryRunner.query(`DROP TABLE "shipments"`);
    await queryRunner.query(
      `DROP INDEX "public"."UQ_courier_accounts_one_default"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_654faec719fb531dac16c62b4d"`,
    );
    await queryRunner.query(`DROP TABLE "courier_accounts"`);
  }
}
