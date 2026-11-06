import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1792695205907 implements MigrationInterface {
  name = 'InitialSchema1792695205907';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "divisions" ("id" smallint GENERATED ALWAYS AS IDENTITY NOT NULL, "name_en" text NOT NULL, "name_bn" text NOT NULL, CONSTRAINT "UQ_fd6332a532030d4b4ce535d1b50" UNIQUE ("name_en"), CONSTRAINT "PK_c1f864477b3fd0954564108ed96" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "districts" ("id" smallint GENERATED ALWAYS AS IDENTITY NOT NULL, "division_id" smallint NOT NULL, "name_en" text NOT NULL, "name_bn" text NOT NULL, CONSTRAINT "UQ_6da39a4199296a9dba4c3df1f49" UNIQUE ("division_id", "name_en"), CONSTRAINT "PK_972a72ff4e3bea5c7f43a2b98af" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "areas" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "district_id" smallint NOT NULL, "name_en" text NOT NULL, "name_bn" text NOT NULL, "kind" character varying(20) NOT NULL DEFAULT 'thana', "is_serviceable" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_40378560986690c91e4aacbd545" UNIQUE ("district_id", "name_en"), CONSTRAINT "CHK_areas_kind" CHECK ("kind" IN ('thana', 'upazila', 'city_area')), CONSTRAINT "PK_5110493f6342f34c978c084d0d6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "phone" character varying(14) NOT NULL, "email" text, "full_name" text, "avatar_url" text, "preferred_language" character(2) NOT NULL DEFAULT 'bn', "phone_verified_at" TIMESTAMP WITH TIME ZONE, "status" character varying(20) NOT NULL DEFAULT 'active', "no_show_count" smallint NOT NULL DEFAULT '0', "last_login_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "CHK_users_language" CHECK ("preferred_language" IN ('bn', 'en')), CONSTRAINT "CHK_users_status" CHECK ("status" IN ('active', 'suspended', 'deleted')), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "platform_staff" ("user_id" integer NOT NULL, "role" character varying(20) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_platform_staff_role" CHECK ("role" IN ('super_admin', 'ops', 'onboarding', 'support', 'finance')), CONSTRAINT "PK_7b9efb95cf7853b29f57d22e277" PRIMARY KEY ("user_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_devices" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "user_id" integer NOT NULL, "platform" character varying(10) NOT NULL, "push_token" text NOT NULL, "app_version" text, "last_seen_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_c74f9dcb05772e4b9dea80d3a41" UNIQUE ("push_token"), CONSTRAINT "CHK_user_devices_platform" CHECK ("platform" IN ('android', 'ios', 'web')), CONSTRAINT "PK_c9e7e648903a9e537347aba4371" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_28bd79e1b3f7c1168f0904ce24" ON "user_devices"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_addresses" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "user_id" integer NOT NULL, "label" text, "recipient_name" text NOT NULL, "phone" character varying(14) NOT NULL, "area_id" integer NOT NULL, "address_line" text NOT NULL, "landmark" text, "latitude" numeric(9,6), "longitude" numeric(9,6), "is_default" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8abbeb5e3239ff7877088ffc25b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7a5100ce0548ef27a6f1533a5c" ON "user_addresses"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_user_addresses_one_default" ON "user_addresses"  ("user_id") WHERE "is_default"`,
    );
    await queryRunner.query(
      `CREATE TABLE "markets" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "slug" text NOT NULL, "name_en" text NOT NULL, "name_bn" text NOT NULL, "kind" character varying(20) NOT NULL, "description" text, "area_id" integer NOT NULL, "address_line" text NOT NULL, "latitude" numeric(9,6), "longitude" numeric(9,6), "logo_url" text, "cover_url" text, "opens_at" TIME, "closes_at" TIME, "weekly_off_day" smallint, "is_partner" boolean NOT NULL DEFAULT false, "partner_since" date, "status" character varying(20) NOT NULL DEFAULT 'draft', "created_by" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_fd5c6ef3d47e6df1d2e355c302c" UNIQUE ("slug"), CONSTRAINT "CHK_markets_off_day" CHECK ("weekly_off_day" BETWEEN 0 AND 6), CONSTRAINT "CHK_markets_status" CHECK ("status" IN ('draft', 'active', 'inactive')), CONSTRAINT "CHK_markets_kind" CHECK ("kind" IN ('mall', 'market', 'bazaar', 'wholesale_market', 'street_market')), CONSTRAINT "PK_dda44129b32f21ae9f1c28dcf99" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d264561c1d0860970b7ca2658f" ON "markets"  ("area_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "market_floors" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "market_id" integer NOT NULL, "level" smallint NOT NULL, "name_en" text NOT NULL, "name_bn" text, "map_image_url" text, CONSTRAINT "UQ_b9765b9018a5f74734e75af4536" UNIQUE ("market_id", "level"), CONSTRAINT "PK_fa64950298a17a831da4b374966" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "market_members" ("market_id" integer NOT NULL, "user_id" integer NOT NULL, "role" character varying(20) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_market_members_role" CHECK ("role" IN ('admin', 'manager', 'desk_staff')), CONSTRAINT "PK_8247c27cedb4ec12c2aedc4eaa3" PRIMARY KEY ("market_id", "user_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_daf3c24d1f5abf726abbea0677" ON "market_members"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "pickup_points" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "market_id" integer NOT NULL, "floor_id" integer, "name_en" text NOT NULL, "name_bn" text, "instructions" text, "opens_at" TIME, "closes_at" TIME, "is_hub" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8fe939caf756e30da9a5b5d7317" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0a3c7a707500291fedca9b8f34" ON "pickup_points"  ("market_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "shops" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "slug" text NOT NULL, "market_id" integer, "floor_id" integer, "shop_number" text, "block" text, "walk_order" integer, "map_x" numeric(6,2), "map_y" numeric(6,2), "name_en" text NOT NULL, "name_bn" text, "description" text, "logo_url" text, "cover_url" text, "phone" character varying(14), "whatsapp" character varying(14), "area_id" integer, "address_line" text, "latitude" numeric(9,6), "longitude" numeric(9,6), "primary_category_id" integer, "accepts_offers" boolean NOT NULL DEFAULT true, "accepts_cash_on_pickup" boolean NOT NULL DEFAULT true, "deposit_percent" numeric(5,2) NOT NULL DEFAULT '0', "reservation_hours" smallint NOT NULL DEFAULT '24', "return_window_days" smallint NOT NULL DEFAULT '3', "return_policy" text, "warranty_policy" text, "status" character varying(20) NOT NULL DEFAULT 'pending', "is_verified" boolean NOT NULL DEFAULT false, "verified_at" TIMESTAMP WITH TIME ZONE, "rating_avg" numeric(3,2) NOT NULL DEFAULT '0', "rating_count" integer NOT NULL DEFAULT '0', "onboarded_by" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_8c28ec876676eeb1dcb65c01b7f" UNIQUE ("slug"), CONSTRAINT "CHK_shops_deposit" CHECK ("deposit_percent" BETWEEN 0 AND 100), CONSTRAINT "CHK_shops_location" CHECK ("market_id" IS NOT NULL OR "area_id" IS NOT NULL), CONSTRAINT "CHK_shops_status" CHECK ("status" IN ('pending', 'active', 'suspended', 'closed')), CONSTRAINT "PK_3c6aaa6607d287de99815e60b96" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2c0d65f24ec5d3c9a54f99e152" ON "shops"  ("primary_category_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_shops_market_number" ON "shops"  ("market_id", "shop_number") WHERE "shop_number" IS NOT NULL AND "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_shops_walk" ON "shops"  ("market_id", "floor_id", "walk_order") `,
    );
    await queryRunner.query(
      `CREATE TABLE "shop_members" ("shop_id" integer NOT NULL, "user_id" integer NOT NULL, "role" character varying(20) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_shop_members_role" CHECK ("role" IN ('owner', 'manager', 'staff')), CONSTRAINT "PK_e2b6cc91da6b996f4bd5d3d5601" PRIMARY KEY ("shop_id", "user_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f0147e76ed9a1c177f667304df" ON "shop_members"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "shop_categories" ("shop_id" integer NOT NULL, "category_id" integer NOT NULL, CONSTRAINT "PK_4230ee63b02057d4028fcc4241a" PRIMARY KEY ("shop_id", "category_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ee4fccaada563c04413b8916d0" ON "shop_categories"  ("category_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "shop_hours" ("shop_id" integer NOT NULL, "weekday" smallint NOT NULL, "opens_at" TIME, "closes_at" TIME, "is_closed" boolean NOT NULL DEFAULT false, CONSTRAINT "CHK_shop_hours_weekday" CHECK ("weekday" BETWEEN 0 AND 6), CONSTRAINT "PK_d89c6e31f810fcfa401621ba8e0" PRIMARY KEY ("shop_id", "weekday"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "shop_verifications" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "shop_id" integer NOT NULL, "kind" character varying(20) NOT NULL, "document_number" text, "document_url" text, "status" character varying(20) NOT NULL DEFAULT 'pending', "expires_on" date, "reviewed_by" integer, "reviewed_at" TIMESTAMP WITH TIME ZONE, "notes" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_shop_verifications_status" CHECK ("status" IN ('pending', 'approved', 'rejected', 'expired')), CONSTRAINT "CHK_shop_verifications_kind" CHECK ("kind" IN ('trade_license', 'owner_nid', 'tin', 'bin_vat', 'physical_visit')), CONSTRAINT "PK_ff5175ba02615379f9c56f1fa49" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a651bd564c34e63abbcf110129" ON "shop_verifications"  ("shop_id", "kind") `,
    );
    await queryRunner.query(
      `CREATE TABLE "shop_payout_accounts" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "shop_id" integer NOT NULL, "method" character varying(10) NOT NULL, "account_name" text NOT NULL, "account_number" text NOT NULL, "bank_name" text, "branch_name" text, "routing_number" text, "is_default" boolean NOT NULL DEFAULT false, "verified_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_shop_payout_accounts_method" CHECK ("method" IN ('bkash', 'nagad', 'bank')), CONSTRAINT "PK_09ed0f121c5b370b4ad02e1d016" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_shop_payout_accounts_one_default" ON "shop_payout_accounts"  ("shop_id") WHERE "is_default"`,
    );
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "parent_id" integer, "slug" text NOT NULL, "name_en" text NOT NULL, "name_bn" text NOT NULL, "icon" text, "sort_order" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09" UNIQUE ("slug"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_88cea2dc9c31951d06437879b4" ON "categories"  ("parent_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "brands" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "slug" text NOT NULL, "name" text NOT NULL, "logo_url" text, CONSTRAINT "UQ_b15428f362be2200922952dc268" UNIQUE ("slug"), CONSTRAINT "PK_b0c437120b624da1034a81fc561" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "size_charts" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "category_id" integer NOT NULL, "shop_id" integer, "name" text NOT NULL, "chart" jsonb NOT NULL, CONSTRAINT "PK_9a856588006e41aafef85dee028" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'cholo_market',
        'public',
        'products',
        'GENERATED_COLUMN',
        'search_vector',
        "to_tsvector('simple', coalesce(name_en, '') || ' ' || coalesce(name_bn, '') || ' ' || coalesce(description, ''))",
      ],
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "shop_id" integer NOT NULL, "category_id" integer NOT NULL, "brand_id" integer, "size_chart_id" integer, "slug" text NOT NULL, "name_en" text NOT NULL, "name_bn" text, "description" text, "condition" character varying(20) NOT NULL DEFAULT 'new', "warranty_type" character varying(20) NOT NULL DEFAULT 'none', "warranty_months" smallint, "is_negotiable" boolean NOT NULL DEFAULT false, "min_price" numeric(12,2), "status" character varying(20) NOT NULL DEFAULT 'draft', "rating_avg" numeric(3,2) NOT NULL DEFAULT '0', "rating_count" integer NOT NULL DEFAULT '0', "search_vector" tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(name_en, '') || ' ' || coalesce(name_bn, '') || ' ' || coalesce(description, ''))) STORED NOT NULL, "created_by" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_e7cff1073f7716f8cbc61004bd0" UNIQUE ("shop_id", "slug"), CONSTRAINT "CHK_products_warranty" CHECK ("warranty_type" IN ('none', 'shop', 'brand_official')), CONSTRAINT "CHK_products_condition" CHECK ("condition" IN ('new', 'used', 'refurbished')), CONSTRAINT "CHK_products_status" CHECK ("status" IN ('draft', 'active', 'hidden', 'archived')), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_category_status" ON "products"  ("category_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_shop_status" ON "products"  ("shop_id", "status") `,
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'cholo_market',
        'public',
        'product_variants',
        'GENERATED_COLUMN',
        'available_qty',
        '"stock_qty" - "reserved_qty"',
      ],
    );
    await queryRunner.query(
      `CREATE TABLE "product_variants" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "product_id" integer NOT NULL, "sku" text, "barcode" text, "attributes" jsonb NOT NULL DEFAULT '{}', "price" numeric(12,2) NOT NULL DEFAULT '0', "compare_at_price" numeric(12,2), "min_offer_price" numeric(12,2), "stock_qty" integer NOT NULL DEFAULT '0', "reserved_qty" integer NOT NULL DEFAULT '0', "available_qty" integer GENERATED ALWAYS AS ("stock_qty" - "reserved_qty") STORED NOT NULL, "low_stock_threshold" integer NOT NULL DEFAULT '2', "stock_updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_variants_reserved" CHECK ("reserved_qty" >= 0 AND "reserved_qty" <= "stock_qty"), CONSTRAINT "CHK_variants_stock" CHECK ("stock_qty" >= 0), CONSTRAINT "CHK_variants_price" CHECK ("price" >= 0), CONSTRAINT "PK_281e3f2c55652d6a22c0aa59fd7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6343513e20e2deab45edfce131" ON "product_variants"  ("product_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "product_images" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "product_id" integer NOT NULL, "variant_id" integer, "url" text NOT NULL, "sort_order" smallint NOT NULL DEFAULT '0', CONSTRAINT "PK_1974264ea7265989af8392f63a1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7d5349c9553f4b30ad8aef0b37" ON "product_images"  ("product_id", "sort_order") `,
    );
    await queryRunner.query(
      `CREATE TABLE "inventory_movements" ("id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL, "variant_id" integer NOT NULL, "stock_change" integer NOT NULL DEFAULT '0', "reserved_change" integer NOT NULL DEFAULT '0', "reason" character varying(20) NOT NULL, "order_item_id" integer, "note" text, "created_by" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_inventory_movements_reason" CHECK ("reason" IN ('restock', 'manual_adjust', 'offline_sale', 'reserve', 'release', 'online_sale', 'return', 'damaged', 'import')), CONSTRAINT "PK_d7597827c1dcffae889db3ab873" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_38e2f32be31de92b8cec259304" ON "inventory_movements"  ("variant_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "wishlist_items" ("user_id" integer NOT NULL, "product_id" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e0584a3664156caa678765afadc" PRIMARY KEY ("user_id", "product_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "shop_follows" ("user_id" integer NOT NULL, "shop_id" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9889180ad500c6b01e22df57125" PRIMARY KEY ("user_id", "shop_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "conversations" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "customer_id" integer NOT NULL, "shop_id" integer NOT NULL, "last_message_at" TIMESTAMP WITH TIME ZONE, "last_message_preview" text, "customer_unread" integer NOT NULL DEFAULT '0', "shop_unread" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_54a9a62dc30a0df423593afd8c1" UNIQUE ("customer_id", "shop_id"), CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cd14e743131cc940bce9124fa7" ON "conversations"  ("shop_id", "last_message_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "price_offers" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "conversation_id" integer NOT NULL, "customer_id" integer NOT NULL, "shop_id" integer NOT NULL, "variant_id" integer NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "list_price" numeric(12,2) NOT NULL DEFAULT '0', "offered_price" numeric(12,2) NOT NULL DEFAULT '0', "counter_price" numeric(12,2), "final_price" numeric(12,2), "status" character varying(20) NOT NULL DEFAULT 'pending', "responded_by" integer, "responded_at" TIMESTAMP WITH TIME ZONE, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_price_offers_price" CHECK ("offered_price" > 0), CONSTRAINT "CHK_price_offers_qty" CHECK ("quantity" > 0), CONSTRAINT "CHK_price_offers_status" CHECK ("status" IN ('pending', 'countered', 'accepted', 'rejected', 'withdrawn', 'expired', 'used')), CONSTRAINT "PK_3aaddc6463f62236fa2cdf89f1a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_682c3bb53ffb9f45ddf5d959ba" ON "price_offers"  ("customer_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_389ead41c18f28080df485f3fc" ON "price_offers"  ("shop_id", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "messages" ("id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL, "conversation_id" integer NOT NULL, "sender_id" integer NOT NULL, "sender_side" character varying(10) NOT NULL, "body" text, "attachment_url" text, "product_id" integer, "offer_id" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "read_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "CHK_messages_side" CHECK ("sender_side" IN ('customer', 'shop', 'system')), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8584a1974e1ca95f4861d975ff" ON "messages"  ("conversation_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "coupons" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "code" text NOT NULL, "funded_by" character varying(10) NOT NULL, "shop_id" integer, "market_id" integer, "discount_type" character varying(10) NOT NULL, "discount_value" numeric(12,2) NOT NULL DEFAULT '0', "max_discount" numeric(12,2), "min_order_total" numeric(12,2) NOT NULL DEFAULT '0', "usage_limit" integer, "per_user_limit" integer NOT NULL DEFAULT '1', "used_count" integer NOT NULL DEFAULT '0', "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL, "ends_at" TIMESTAMP WITH TIME ZONE NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_e025109230e82925843f2a14c48" UNIQUE ("code"), CONSTRAINT "CHK_coupons_value" CHECK ("discount_value" > 0), CONSTRAINT "CHK_coupons_type" CHECK ("discount_type" IN ('percent', 'fixed')), CONSTRAINT "CHK_coupons_funder" CHECK ("funded_by" IN ('platform', 'shop', 'market')), CONSTRAINT "PK_d7ea8864a0150183770f3e9a8cb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "coupon_redemptions" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "coupon_id" integer NOT NULL, "order_id" integer NOT NULL, "user_id" integer NOT NULL, "discount_amount" numeric(12,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_adb70aa4959d5b2676fa4fde836" UNIQUE ("order_id"), CONSTRAINT "PK_5086813ea980d21dbeb190ed0a7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dd4cda7c82246e92c50453fda3" ON "coupon_redemptions"  ("coupon_id", "user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "gift_cards" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "code" text NOT NULL, "market_id" integer, "initial_amount" numeric(12,2) NOT NULL DEFAULT '0', "balance" numeric(12,2) NOT NULL DEFAULT '0', "purchased_by" integer, "owner_id" integer, "status" character varying(20) NOT NULL DEFAULT 'active', "expires_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_08ff997110a4e3842076964f0ed" UNIQUE ("code"), CONSTRAINT "CHK_gift_cards_amounts" CHECK ("initial_amount" > 0 AND "balance" >= 0), CONSTRAINT "CHK_gift_cards_status" CHECK ("status" IN ('inactive', 'active', 'exhausted', 'expired', 'blocked')), CONSTRAINT "PK_66a0b66755efd01b1749861b4aa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "gift_card_transactions" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "gift_card_id" integer NOT NULL, "order_id" integer, "kind" character varying(10) NOT NULL, "amount" numeric(12,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_gift_card_tx_kind" CHECK ("kind" IN ('issue', 'redeem', 'refund', 'adjust')), CONSTRAINT "PK_6462acb8f53b9976df905077ed7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_06aa31c15a76f1463637b07420" ON "gift_card_transactions"  ("gift_card_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "orders" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "order_no" text NOT NULL, "customer_id" integer NOT NULL, "contact_name" text NOT NULL, "contact_phone" character varying(14) NOT NULL, "status" character varying(25) NOT NULL DEFAULT 'pending_payment', "payment_status" character varying(25) NOT NULL DEFAULT 'unpaid', "subtotal" numeric(12,2) NOT NULL DEFAULT '0', "discount_total" numeric(12,2) NOT NULL DEFAULT '0', "pickup_fee" numeric(12,2) NOT NULL DEFAULT '0', "delivery_fee" numeric(12,2) NOT NULL DEFAULT '0', "grand_total" numeric(12,2) NOT NULL DEFAULT '0', "amount_due_online" numeric(12,2) NOT NULL DEFAULT '0', "amount_paid" numeric(12,2) NOT NULL DEFAULT '0', "coupon_id" integer, "delivery_address" jsonb, "customer_note" text, "placed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_035026a83bef9740d7ad05df383" UNIQUE ("order_no"), CONSTRAINT "CHK_orders_total" CHECK ("grand_total" = "subtotal" - "discount_total" + "pickup_fee" + "delivery_fee"), CONSTRAINT "CHK_orders_payment_status" CHECK ("payment_status" IN ('unpaid', 'deposit_paid', 'paid', 'partially_refunded', 'refunded')), CONSTRAINT "CHK_orders_status" CHECK ("status" IN ('pending_payment', 'placed', 'in_progress', 'completed', 'partially_completed', 'cancelled')), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_11fefa35e3ef25881234b8b89a" ON "orders"  ("customer_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "shop_orders" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "order_id" integer NOT NULL, "shop_id" integer NOT NULL, "sub_order_no" text NOT NULL, "status" character varying(25) NOT NULL DEFAULT 'placed', "fulfillment_type" character varying(20) NOT NULL DEFAULT 'shop_pickup', "pickup_point_id" integer, "pickup_code" character varying(6) NOT NULL, "reserved_until" TIMESTAMP WITH TIME ZONE, "subtotal" numeric(12,2) NOT NULL DEFAULT '0', "discount_total" numeric(12,2) NOT NULL DEFAULT '0', "total" numeric(12,2) NOT NULL DEFAULT '0', "commission_total" numeric(12,2) NOT NULL DEFAULT '0', "cash_due" numeric(12,2) NOT NULL DEFAULT '0', "confirmed_at" TIMESTAMP WITH TIME ZONE, "ready_at" TIMESTAMP WITH TIME ZONE, "completed_at" TIMESTAMP WITH TIME ZONE, "cancelled_at" TIMESTAMP WITH TIME ZONE, "cancel_reason" text, "cancelled_by" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_9c1cfaf690e10c0712fa9fe3b38" UNIQUE ("sub_order_no"), CONSTRAINT "UQ_566c7abbcc0f8f8d1a803c9b125" UNIQUE ("order_id", "shop_id"), CONSTRAINT "CHK_shop_orders_desk" CHECK ("fulfillment_type" <> 'desk_pickup' OR "pickup_point_id" IS NOT NULL), CONSTRAINT "CHK_shop_orders_fulfillment" CHECK ("fulfillment_type" IN ('shop_pickup', 'desk_pickup', 'delivery')), CONSTRAINT "CHK_shop_orders_status" CHECK ("status" IN ('placed', 'confirmed', 'ready_for_pickup', 'handed_to_rider', 'out_for_delivery', 'completed', 'rejected', 'cancelled', 'expired')), CONSTRAINT "PK_144b24698d178764ea5bb26da3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_shop_orders_reserved_until" ON "shop_orders"  ("reserved_until") WHERE "status" IN ('placed', 'confirmed', 'ready_for_pickup')`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_shop_orders_shop_status" ON "shop_orders"  ("shop_id", "status", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "order_items" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "shop_order_id" integer NOT NULL, "variant_id" integer NOT NULL, "product_id" integer NOT NULL, "product_name" text NOT NULL, "variant_label" text, "sku" text, "image_url" text, "category_id" integer NOT NULL, "list_price" numeric(12,2) NOT NULL DEFAULT '0', "unit_price" numeric(12,2) NOT NULL DEFAULT '0', "quantity" integer NOT NULL, "line_total" numeric(12,2) NOT NULL DEFAULT '0', "offer_id" integer, "commission_rate" numeric(5,2) NOT NULL DEFAULT '0', "commission_amount" numeric(12,2) NOT NULL DEFAULT '0', "status" character varying(20) NOT NULL DEFAULT 'active', "returned_qty" integer NOT NULL DEFAULT '0', CONSTRAINT "CHK_order_items_status" CHECK ("status" IN ('active', 'cancelled', 'returned', 'partially_returned')), CONSTRAINT "CHK_order_items_returned" CHECK ("returned_qty" BETWEEN 0 AND "quantity"), CONSTRAINT "CHK_order_items_line" CHECK ("line_total" = "unit_price" * "quantity"), CONSTRAINT "CHK_order_items_qty" CHECK ("quantity" > 0), CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ce507559d955e3fdb64a4b6ccb" ON "order_items"  ("shop_order_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_db2d0ea722e16e0fe8ab3bce11" ON "order_items"  ("variant_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "shop_order_events" ("id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL, "shop_order_id" integer NOT NULL, "from_status" character varying(25), "to_status" character varying(25) NOT NULL, "actor_id" integer, "note" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8b98ce175b90a63f8adcdfcd5b5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dfd059abfd04acb470d27822d4" ON "shop_order_events"  ("shop_order_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "return_requests" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "shop_order_id" integer NOT NULL, "customer_id" integer NOT NULL, "reason" character varying(20) NOT NULL, "details" text, "photo_urls" text array NOT NULL DEFAULT '{}', "resolution" character varying(20), "status" character varying(20) NOT NULL DEFAULT 'requested', "reviewed_by" integer, "reviewed_at" TIMESTAMP WITH TIME ZONE, "shop_note" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_return_requests_status" CHECK ("status" IN ('requested', 'approved', 'rejected', 'item_received', 'resolved')), CONSTRAINT "CHK_return_requests_resolution" CHECK ("resolution" IS NULL OR "resolution" IN ('refund', 'exchange', 'store_credit', 'repair')), CONSTRAINT "CHK_return_requests_reason" CHECK ("reason" IN ('wrong_size', 'defective', 'not_as_described', 'wrong_item', 'changed_mind', 'warranty_claim', 'other')), CONSTRAINT "PK_38714de8942bd9bc3a450a06889" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e432a7251bc55359ce655fcc92" ON "return_requests"  ("shop_order_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "return_items" ("return_request_id" integer NOT NULL, "order_item_id" integer NOT NULL, "quantity" integer NOT NULL, CONSTRAINT "CHK_return_items_qty" CHECK ("quantity" > 0), CONSTRAINT "PK_fb52146d267390869cfccf00809" PRIMARY KEY ("return_request_id", "order_item_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "reviews" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "user_id" integer NOT NULL, "shop_id" integer NOT NULL, "product_id" integer, "shop_order_id" integer NOT NULL, "rating" smallint NOT NULL, "comment" text, "photo_urls" text array NOT NULL DEFAULT '{}', "shop_reply" text, "shop_replied_at" TIMESTAMP WITH TIME ZONE, "status" character varying(15) NOT NULL DEFAULT 'published', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_reviews_status" CHECK ("status" IN ('published', 'hidden')), CONSTRAINT "CHK_reviews_rating" CHECK ("rating" BETWEEN 1 AND 5), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9482e9567d8dcc2bc615981ef4" ON "reviews"  ("product_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_59b38438ffca2178e770920167" ON "reviews"  ("shop_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "support_tickets" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "ticket_no" text NOT NULL, "user_id" integer, "phone" character varying(14), "order_id" integer, "shop_id" integer, "channel" character varying(15) NOT NULL, "category" character varying(20) NOT NULL, "subject" text NOT NULL, "description" text, "status" character varying(20) NOT NULL DEFAULT 'open', "priority" character varying(10) NOT NULL DEFAULT 'normal', "assigned_to" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "resolved_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_fcb4080d9d57424031c4880cb21" UNIQUE ("ticket_no"), CONSTRAINT "CHK_support_tickets_priority" CHECK ("priority" IN ('low', 'normal', 'high', 'urgent')), CONSTRAINT "CHK_support_tickets_status" CHECK ("status" IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')), CONSTRAINT "CHK_support_tickets_category" CHECK ("category" IN ('order', 'payment', 'refund', 'shop_complaint', 'fraud', 'account', 'other')), CONSTRAINT "CHK_support_tickets_channel" CHECK ("channel" IN ('hotline', 'app', 'chat', 'email', 'facebook')), CONSTRAINT "PK_942e8d8f5df86100471d2324643" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_11d8635c21eeba3de3e8769424" ON "support_tickets"  ("status", "priority") `,
    );
    await queryRunner.query(
      `CREATE TABLE "support_ticket_notes" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "ticket_id" integer NOT NULL, "author_id" integer NOT NULL, "body" text NOT NULL, "is_internal" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ce42d5ec9d5731befe4fdd7c190" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ce997a05626cd5a5861ca288dd" ON "support_ticket_notes"  ("ticket_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "carts" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "user_id" integer, "guest_token" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_2ec1c94a977b940d85a4f498aea" UNIQUE ("user_id"), CONSTRAINT "UQ_be65dcd886ccd9393bda1e18230" UNIQUE ("guest_token"), CONSTRAINT "REL_2ec1c94a977b940d85a4f498ae" UNIQUE ("user_id"), CONSTRAINT "CHK_carts_owner" CHECK ("user_id" IS NOT NULL OR "guest_token" IS NOT NULL), CONSTRAINT "PK_b5f695a59f5ebb50af3c8160816" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "cart_items" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "cart_id" integer NOT NULL, "variant_id" integer NOT NULL, "shop_id" integer NOT NULL, "quantity" integer NOT NULL, "offer_id" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_d1a62275445322e93824d33dbfe" UNIQUE ("cart_id", "variant_id"), CONSTRAINT "CHK_cart_items_qty" CHECK ("quantity" > 0), CONSTRAINT "PK_6fccf5ec03c172d27a28a82928b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ede780fc2b865d1d1323e59803" ON "cart_items"  ("variant_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "riders" ("user_id" integer NOT NULL, "home_hub_id" integer, "vehicle_type" character varying(10) NOT NULL, "nid_verified" boolean NOT NULL DEFAULT false, "status" character varying(15) NOT NULL DEFAULT 'offline', "last_latitude" numeric(9,6), "last_longitude" numeric(9,6), "last_seen_at" TIMESTAMP WITH TIME ZONE, "cash_in_hand" numeric(12,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_riders_status" CHECK ("status" IN ('offline', 'available', 'busy', 'suspended')), CONSTRAINT "CHK_riders_vehicle" CHECK ("vehicle_type" IN ('bicycle', 'motorbike', 'van')), CONSTRAINT "PK_8d3d41e9ec12eff82b325fa8c07" PRIMARY KEY ("user_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "deliveries" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "order_id" integer NOT NULL, "hub_id" integer NOT NULL, "rider_id" integer, "address" jsonb NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'pending', "fee" numeric(12,2) NOT NULL DEFAULT '0', "rider_earning" numeric(12,2) NOT NULL DEFAULT '0', "cod_amount" numeric(12,2) NOT NULL DEFAULT '0', "delivery_otp" character varying(6), "proof_photo_url" text, "assigned_at" TIMESTAMP WITH TIME ZONE, "delivered_at" TIMESTAMP WITH TIME ZONE, "failure_reason" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_deliveries_status" CHECK ("status" IN ('pending', 'assigned', 'collecting', 'at_hub', 'out_for_delivery', 'delivered', 'failed', 'returned')), CONSTRAINT "PK_a6ef225c5c5f0974e503bfb731f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2a761d0390e33990ab5862bbbe" ON "deliveries"  ("rider_id", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "delivery_shop_orders" ("delivery_id" integer NOT NULL, "shop_order_id" integer NOT NULL, "collected_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_0c73938a51864024deb354fbeab" PRIMARY KEY ("delivery_id", "shop_order_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "order_id" integer NOT NULL, "shop_order_id" integer, "method" character varying(15) NOT NULL, "purpose" character varying(10) NOT NULL, "amount" numeric(12,2) NOT NULL DEFAULT '0', "status" character varying(15) NOT NULL DEFAULT 'initiated', "gateway" character varying(20), "gateway_payment_id" text, "gateway_trx_id" text, "payer_account" text, "collected_by" integer, "gateway_response" jsonb, "paid_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_b7e96f687c7b9129039cc82d0e6" UNIQUE ("gateway", "gateway_trx_id"), CONSTRAINT "CHK_payments_amount" CHECK ("amount" > 0), CONSTRAINT "CHK_payments_status" CHECK ("status" IN ('initiated', 'pending', 'succeeded', 'failed', 'cancelled')), CONSTRAINT "CHK_payments_purpose" CHECK ("purpose" IN ('full', 'deposit', 'balance')), CONSTRAINT "CHK_payments_method" CHECK ("method" IN ('bkash', 'nagad', 'card', 'cash', 'gift_card')), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b2f7b823a21562eeca20e72b00" ON "payments"  ("order_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_webhook_events" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "gateway" character varying(20) NOT NULL, "event_id" text NOT NULL, "payload" jsonb NOT NULL, "received_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "processed_at" TIMESTAMP WITH TIME ZONE, "error" text, CONSTRAINT "UQ_f3ab3e1dcfb30f1a4f3e5680b81" UNIQUE ("gateway", "event_id"), CONSTRAINT "PK_750875e71d97974be92cee813ba" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "refunds" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "payment_id" integer NOT NULL, "shop_order_id" integer, "return_request_id" integer, "amount" numeric(12,2) NOT NULL DEFAULT '0', "reason" text, "status" character varying(15) NOT NULL DEFAULT 'pending', "gateway_refund_id" text, "processed_by" integer, "processed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_refunds_amount" CHECK ("amount" > 0), CONSTRAINT "CHK_refunds_status" CHECK ("status" IN ('pending', 'processing', 'succeeded', 'failed')), CONSTRAINT "PK_5106efb01eeda7e49a78b869738" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7f48aa5d56c42aeb495db01668" ON "refunds"  ("payment_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL, "user_id" integer NOT NULL, "kind" character varying(40) NOT NULL, "title" text NOT NULL, "body" text, "data" jsonb NOT NULL DEFAULT '{}', "channels" text array NOT NULL DEFAULT '{in_app}', "read_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_310667f935698fcd8cb319113a" ON "notifications"  ("user_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "platform_settings" ("key" text NOT NULL, "value" jsonb NOT NULL, "updated_by" integer, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5d9031e30fac3ec3ec8b9602e17" PRIMARY KEY ("key"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "search_queries" ("id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL, "user_id" integer, "query" text NOT NULL, "scope" character varying(10) NOT NULL, "market_id" integer, "results_count" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_search_queries_scope" CHECK ("scope" IN ('all', 'market', 'shop', 'product')), CONSTRAINT "PK_2945172d2d9a9f6b2339dd036e7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4981129d48833f45cc3e70f06b" ON "search_queries"  ("created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" bigint GENERATED ALWAYS AS IDENTITY NOT NULL, "actor_id" integer, "action" text NOT NULL, "entity_type" text NOT NULL, "entity_id" integer, "changes" jsonb, "ip_address" inet, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7421efc125d95e413657efa3c6" ON "audit_logs"  ("entity_type", "entity_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "import_jobs" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "shop_id" integer NOT NULL, "created_by" integer NOT NULL, "file_name" text NOT NULL, "status" character varying(15) NOT NULL DEFAULT 'queued', "total_rows" integer NOT NULL DEFAULT '0', "created_count" integer NOT NULL DEFAULT '0', "updated_count" integer NOT NULL DEFAULT '0', "failed_count" integer NOT NULL DEFAULT '0', "errors" jsonb NOT NULL DEFAULT '[]', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "finished_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "CHK_import_jobs_status" CHECK ("status" IN ('queued', 'processing', 'completed', 'failed')), CONSTRAINT "PK_4d206c602f173f98e4bb85819a3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4e7e9456e13d26f5a005bdc383" ON "import_jobs"  ("shop_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "commission_rules" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "category_id" integer, "market_id" integer, "shop_id" integer, "rate" numeric(5,2) NOT NULL DEFAULT '0', "valid_from" TIMESTAMP WITH TIME ZONE NOT NULL, "valid_to" TIMESTAMP WITH TIME ZONE, "note" text, "created_by" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_commission_rules_rate" CHECK ("rate" BETWEEN 0 AND 100), CONSTRAINT "PK_399c9fa57f7fd28dfc57acea3bd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0a3ef3a3d31b8658fc1c895b17" ON "commission_rules"  ("category_id", "valid_from") `,
    );
    await queryRunner.query(
      `CREATE TABLE "subscription_plans" ("id" smallint GENERATED ALWAYS AS IDENTITY NOT NULL, "code" text NOT NULL, "name_en" text NOT NULL, "name_bn" text NOT NULL, "monthly_price" numeric(12,2) NOT NULL DEFAULT '0', "max_products" integer, "max_staff" integer, "commission_discount" numeric(5,2) NOT NULL DEFAULT '0', "features" jsonb NOT NULL DEFAULT '{}', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_2d2df70a81d37c893ef216caf8a" UNIQUE ("code"), CONSTRAINT "PK_9ab8fe6918451ab3d0a4fb6bb0c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "shop_subscriptions" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "shop_id" integer NOT NULL, "plan_id" smallint NOT NULL, "status" character varying(15) NOT NULL, "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL, "ends_at" TIMESTAMP WITH TIME ZONE, "auto_renew" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_shop_subscriptions_status" CHECK ("status" IN ('trial', 'active', 'past_due', 'cancelled', 'expired')), CONSTRAINT "PK_d8ad5edcf86a22b82e678747220" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_shop_subscriptions_one_current" ON "shop_subscriptions"  ("shop_id") WHERE "status" IN ('trial', 'active', 'past_due')`,
    );
    await queryRunner.query(
      `CREATE TABLE "shop_payouts" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "shop_id" integer NOT NULL, "payout_account_id" integer, "amount" numeric(12,2) NOT NULL DEFAULT '0', "period_start" date NOT NULL, "period_end" date NOT NULL, "status" character varying(15) NOT NULL DEFAULT 'pending', "reference" text, "approved_by" integer, "paid_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_shop_payouts_amount" CHECK ("amount" > 0), CONSTRAINT "CHK_shop_payouts_status" CHECK ("status" IN ('pending', 'processing', 'paid', 'failed')), CONSTRAINT "PK_b8e600369f8de645b3f7ad84406" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_988477d139271e5f88e32eb224" ON "shop_payouts"  ("shop_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "shop_ledger_entries" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "shop_id" integer NOT NULL, "kind" character varying(20) NOT NULL, "amount" numeric(12,2) NOT NULL DEFAULT '0', "shop_order_id" integer, "refund_id" integer, "payout_id" integer, "description" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_shop_ledger_kind" CHECK ("kind" IN ('sale', 'commission', 'refund', 'payout', 'subscription_fee', 'ad_fee', 'adjustment')), CONSTRAINT "PK_ccad2f0781a04199c07747c5e0c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4212d63aba732f01c6c995becf" ON "shop_ledger_entries"  ("shop_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "ad_campaigns" ("id" integer GENERATED ALWAYS AS IDENTITY NOT NULL, "advertiser" character varying(10) NOT NULL, "shop_id" integer, "market_id" integer, "product_id" integer, "placement" character varying(20) NOT NULL, "category_id" integer, "title" text, "image_url" text, "price" numeric(12,2) NOT NULL DEFAULT '0', "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL, "ends_at" TIMESTAMP WITH TIME ZONE NOT NULL, "status" character varying(15) NOT NULL DEFAULT 'scheduled', "impressions" bigint NOT NULL DEFAULT '0', "clicks" bigint NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_ad_campaigns_status" CHECK ("status" IN ('draft', 'scheduled', 'running', 'ended', 'cancelled')), CONSTRAINT "CHK_ad_campaigns_placement" CHECK ("placement" IN ('home_banner', 'search_top', 'category_top', 'market_featured', 'market_sponsor')), CONSTRAINT "CHK_ad_campaigns_advertiser" CHECK ("advertiser" IN ('shop', 'market', 'brand', 'external')), CONSTRAINT "PK_7877713eb87f782dd190eed85a7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cc9358bf81fd343b8fa699787b" ON "ad_campaigns"  ("placement", "starts_at", "ends_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "districts" ADD CONSTRAINT "FK_b0f53665358e2fee2fd290d115f" FOREIGN KEY ("division_id") REFERENCES "divisions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "areas" ADD CONSTRAINT "FK_0133ab4e71f1069d0db0655f2e5" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "platform_staff" ADD CONSTRAINT "FK_7b9efb95cf7853b29f57d22e277" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" ADD CONSTRAINT "FK_28bd79e1b3f7c1168f0904ce241" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" ADD CONSTRAINT "FK_7a5100ce0548ef27a6f1533a5ce" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" ADD CONSTRAINT "FK_3c9b4d155e1f5cc98d6b7063050" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "markets" ADD CONSTRAINT "FK_d264561c1d0860970b7ca2658ff" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "markets" ADD CONSTRAINT "FK_73ad85f11339e35001e60a44fc7" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "market_floors" ADD CONSTRAINT "FK_f21491d640498f453bd4efc5957" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "market_members" ADD CONSTRAINT "FK_45911c0296b23bb57bb2595db77" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "market_members" ADD CONSTRAINT "FK_daf3c24d1f5abf726abbea06778" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pickup_points" ADD CONSTRAINT "FK_0a3c7a707500291fedca9b8f343" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pickup_points" ADD CONSTRAINT "FK_f6f48129fcb8d6c1f9290a7fce8" FOREIGN KEY ("floor_id") REFERENCES "market_floors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shops" ADD CONSTRAINT "FK_db81021849f3006faad9b2242c8" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shops" ADD CONSTRAINT "FK_342c0e88448b150aade000d453e" FOREIGN KEY ("floor_id") REFERENCES "market_floors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shops" ADD CONSTRAINT "FK_4bb54d4b454fbfc410e2917691a" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shops" ADD CONSTRAINT "FK_2c0d65f24ec5d3c9a54f99e1529" FOREIGN KEY ("primary_category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shops" ADD CONSTRAINT "FK_af2e847d1cc4112327381d5bc7e" FOREIGN KEY ("onboarded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_members" ADD CONSTRAINT "FK_721a7b3720a5e1e3a0fabc914d6" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_members" ADD CONSTRAINT "FK_f0147e76ed9a1c177f667304dfc" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_categories" ADD CONSTRAINT "FK_2538b463070f40928e80f0d028c" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_categories" ADD CONSTRAINT "FK_ee4fccaada563c04413b8916d07" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_hours" ADD CONSTRAINT "FK_776e3aa2451c33f8f6632d09732" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_verifications" ADD CONSTRAINT "FK_db05a3df11011f0f3629084b9b8" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_verifications" ADD CONSTRAINT "FK_f1c4af95cc49f455e997cd6725d" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_payout_accounts" ADD CONSTRAINT "FK_de5fe1066db7e38e4ebf4fba58e" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_88cea2dc9c31951d06437879b40" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "size_charts" ADD CONSTRAINT "FK_63e876d56be41cdcc6c0bf4fd5c" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "size_charts" ADD CONSTRAINT "FK_a368b6ab812d967cf3dbf1ab870" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_9e952e93f369f16e27dd786c33f" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_1530a6f15d3c79d1b70be98f2be" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_a2916070ca16e6ec248258c33c9" FOREIGN KEY ("size_chart_id") REFERENCES "size_charts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_c1af9b47239151e255f62e03247" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" ADD CONSTRAINT "FK_6343513e20e2deab45edfce1316" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" ADD CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" ADD CONSTRAINT "FK_7645bd68229997627f7b2191687" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_1bb851d7c7ef2435fad91cae453" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_4a137ccc372acb73821c4dd3991" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" ADD CONSTRAINT "FK_549f44d8b756e2690deb099f83b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" ADD CONSTRAINT "FK_177397e044732e7e9c0215cd5b7" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_follows" ADD CONSTRAINT "FK_6e86e74bd2eb0cb9d4f37f71e1b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_follows" ADD CONSTRAINT "FK_a14449637075fecc1aa160d7264" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_c9f0434c15cacf894e996f69088" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_22fbbb93632ee571505fd76a6bd" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "price_offers" ADD CONSTRAINT "FK_326165f31a5197bb0d8f3d34b41" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "price_offers" ADD CONSTRAINT "FK_69fb52f856f07fc7305ccee01ad" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "price_offers" ADD CONSTRAINT "FK_a7a298f6bde213a5db57893da35" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "price_offers" ADD CONSTRAINT "FK_36609f33f77e0540338c8d9445b" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "price_offers" ADD CONSTRAINT "FK_de203ed1e53a112cc5faa919d55" FOREIGN KEY ("responded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_a6af79f5f202f7e228839b71c8c" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_785fecd3c7dbf760fbabeb6a959" FOREIGN KEY ("offer_id") REFERENCES "price_offers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupons" ADD CONSTRAINT "FK_2a066f63c9dc8cf6094017b6938" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupons" ADD CONSTRAINT "FK_93bf51b012602022d0002d2162b" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "FK_9df1b9bc48e3eea5da3762f8e56" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "FK_adb70aa4959d5b2676fa4fde836" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "FK_986f8dd830915cf2835f89709df" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "gift_cards" ADD CONSTRAINT "FK_c8ed925445accc3214771e79ca1" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "gift_cards" ADD CONSTRAINT "FK_249a496fb5f09086203b0abe882" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "gift_card_transactions" ADD CONSTRAINT "FK_06aa31c15a76f1463637b07420f" FOREIGN KEY ("gift_card_id") REFERENCES "gift_cards"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "gift_card_transactions" ADD CONSTRAINT "FK_d0b40340d3fd81c1d7bb20dcc59" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_6284f0f60e4cb96c12ff96f0f15" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_orders" ADD CONSTRAINT "FK_4f82b4416535d33ed5d93b48a31" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_orders" ADD CONSTRAINT "FK_c67c3ed4f24af42648fac17e0f0" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_orders" ADD CONSTRAINT "FK_d6598b76bf90c1f53ef7dea2e3c" FOREIGN KEY ("pickup_point_id") REFERENCES "pickup_points"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_ce507559d955e3fdb64a4b6ccb0" FOREIGN KEY ("shop_order_id") REFERENCES "shop_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_db2d0ea722e16e0fe8ab3bce111" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_4094d4ef12f2b0d8f24e65a9ca7" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_7fb93ff11c54ec4bb71c78c2fe5" FOREIGN KEY ("offer_id") REFERENCES "price_offers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_order_events" ADD CONSTRAINT "FK_c2fbb6cd945aebdd9565e9c9afd" FOREIGN KEY ("shop_order_id") REFERENCES "shop_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_order_events" ADD CONSTRAINT "FK_68dc0631f465594a95a613771d2" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "return_requests" ADD CONSTRAINT "FK_e432a7251bc55359ce655fcc92d" FOREIGN KEY ("shop_order_id") REFERENCES "shop_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "return_requests" ADD CONSTRAINT "FK_d41ab0aabff469545a236887561" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "return_items" ADD CONSTRAINT "FK_f94d86e7bffa6494f57d9263a4a" FOREIGN KEY ("return_request_id") REFERENCES "return_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "return_items" ADD CONSTRAINT "FK_c57d201363c110de07d1fd32027" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_b8002ad83c018f58beac46dee3f" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_9482e9567d8dcc2bc615981ef44" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_116b47417d5344f6a10cc8370e7" FOREIGN KEY ("shop_order_id") REFERENCES "shop_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" ADD CONSTRAINT "FK_0b1eb4f1f984aab3c481c48468a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" ADD CONSTRAINT "FK_4c3a306f404bff5817f37d46616" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" ADD CONSTRAINT "FK_6d258c19816e99102e2aabcd7be" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" ADD CONSTRAINT "FK_1497d97a1193ff937dea51ac1ea" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_ticket_notes" ADD CONSTRAINT "FK_ce997a05626cd5a5861ca288dda" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_ticket_notes" ADD CONSTRAINT "FK_31f50e4aadf281b5d2ecb46e79e" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "carts" ADD CONSTRAINT "FK_2ec1c94a977b940d85a4f498aea" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD CONSTRAINT "FK_6385a745d9e12a89b859bb25623" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD CONSTRAINT "FK_ede780fc2b865d1d1323e598038" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD CONSTRAINT "FK_ad4336ea52ca96a9094a76cd9f3" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD CONSTRAINT "FK_53d597384719e04ff18d02f5a9f" FOREIGN KEY ("offer_id") REFERENCES "price_offers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "riders" ADD CONSTRAINT "FK_8d3d41e9ec12eff82b325fa8c07" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "riders" ADD CONSTRAINT "FK_4098ce731448bcaac94b1c9b025" FOREIGN KEY ("home_hub_id") REFERENCES "pickup_points"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deliveries" ADD CONSTRAINT "FK_789dba7900f6d25550280ad3b93" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deliveries" ADD CONSTRAINT "FK_bfa72a4a1d9342407a88d2467b3" FOREIGN KEY ("hub_id") REFERENCES "pickup_points"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deliveries" ADD CONSTRAINT "FK_e4ca3c1d4c3c348818b524a071a" FOREIGN KEY ("rider_id") REFERENCES "riders"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_shop_orders" ADD CONSTRAINT "FK_45070a932a5aa693b110fe2bcc1" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_shop_orders" ADD CONSTRAINT "FK_e4763671730f3d1323f9132cf5d" FOREIGN KEY ("shop_order_id") REFERENCES "shop_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_b2f7b823a21562eeca20e72b006" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_67bce91ea45003743852c335867" FOREIGN KEY ("shop_order_id") REFERENCES "shop_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_c30d71dc38577724cd0e248dcc8" FOREIGN KEY ("collected_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" ADD CONSTRAINT "FK_7f48aa5d56c42aeb495db016683" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" ADD CONSTRAINT "FK_a516ad09a9717bf89f42a5b0e95" FOREIGN KEY ("shop_order_id") REFERENCES "shop_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" ADD CONSTRAINT "FK_a46ac94548ec7f359e31c90da88" FOREIGN KEY ("return_request_id") REFERENCES "return_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "search_queries" ADD CONSTRAINT "FK_be640c6890ac457098628795eaa" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_177183f29f438c488b5e8510cdb" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "import_jobs" ADD CONSTRAINT "FK_9b01cc9315b174e9fd028b8da5d" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commission_rules" ADD CONSTRAINT "FK_56cf79cbb1e77621ed7b5591d5d" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commission_rules" ADD CONSTRAINT "FK_fdde897e9a88658d1b645e46f92" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commission_rules" ADD CONSTRAINT "FK_72b4de86b0f88b9a00a7d99a42b" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_subscriptions" ADD CONSTRAINT "FK_f3d2c254e2d2e0b6955722a5b70" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_subscriptions" ADD CONSTRAINT "FK_26c1b95707628016043f1bb0882" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_payouts" ADD CONSTRAINT "FK_27f3a9c8d67afd64f55c17fe2a8" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_payouts" ADD CONSTRAINT "FK_432fb5d06b726f8ce4e6b8fd37b" FOREIGN KEY ("payout_account_id") REFERENCES "shop_payout_accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_payouts" ADD CONSTRAINT "FK_cd10dc43e2ba3ba6a430375772b" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_ledger_entries" ADD CONSTRAINT "FK_0077ff1a0146af056577e80e5c9" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_ledger_entries" ADD CONSTRAINT "FK_75d3cec834a91946e5e1d8bc6bc" FOREIGN KEY ("shop_order_id") REFERENCES "shop_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_ledger_entries" ADD CONSTRAINT "FK_766555c747039ff8fe1715928dd" FOREIGN KEY ("refund_id") REFERENCES "refunds"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_ledger_entries" ADD CONSTRAINT "FK_74c4a0b321c8949039652eff4b5" FOREIGN KEY ("payout_id") REFERENCES "shop_payouts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_campaigns" ADD CONSTRAINT "FK_175fdd2082d25bb70818ef1fbee" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_campaigns" ADD CONSTRAINT "FK_321b0e8815d2cf6fad5990fd39e" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_campaigns" ADD CONSTRAINT "FK_d26afaffdc093b3583bf73c2a67" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ad_campaigns" DROP CONSTRAINT "FK_d26afaffdc093b3583bf73c2a67"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_campaigns" DROP CONSTRAINT "FK_321b0e8815d2cf6fad5990fd39e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ad_campaigns" DROP CONSTRAINT "FK_175fdd2082d25bb70818ef1fbee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_ledger_entries" DROP CONSTRAINT "FK_74c4a0b321c8949039652eff4b5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_ledger_entries" DROP CONSTRAINT "FK_766555c747039ff8fe1715928dd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_ledger_entries" DROP CONSTRAINT "FK_75d3cec834a91946e5e1d8bc6bc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_ledger_entries" DROP CONSTRAINT "FK_0077ff1a0146af056577e80e5c9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_payouts" DROP CONSTRAINT "FK_cd10dc43e2ba3ba6a430375772b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_payouts" DROP CONSTRAINT "FK_432fb5d06b726f8ce4e6b8fd37b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_payouts" DROP CONSTRAINT "FK_27f3a9c8d67afd64f55c17fe2a8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_subscriptions" DROP CONSTRAINT "FK_26c1b95707628016043f1bb0882"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_subscriptions" DROP CONSTRAINT "FK_f3d2c254e2d2e0b6955722a5b70"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commission_rules" DROP CONSTRAINT "FK_72b4de86b0f88b9a00a7d99a42b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commission_rules" DROP CONSTRAINT "FK_fdde897e9a88658d1b645e46f92"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commission_rules" DROP CONSTRAINT "FK_56cf79cbb1e77621ed7b5591d5d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "import_jobs" DROP CONSTRAINT "FK_9b01cc9315b174e9fd028b8da5d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_177183f29f438c488b5e8510cdb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "search_queries" DROP CONSTRAINT "FK_be640c6890ac457098628795eaa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" DROP CONSTRAINT "FK_a46ac94548ec7f359e31c90da88"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" DROP CONSTRAINT "FK_a516ad09a9717bf89f42a5b0e95"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" DROP CONSTRAINT "FK_7f48aa5d56c42aeb495db016683"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_c30d71dc38577724cd0e248dcc8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_67bce91ea45003743852c335867"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_b2f7b823a21562eeca20e72b006"`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_shop_orders" DROP CONSTRAINT "FK_e4763671730f3d1323f9132cf5d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_shop_orders" DROP CONSTRAINT "FK_45070a932a5aa693b110fe2bcc1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deliveries" DROP CONSTRAINT "FK_e4ca3c1d4c3c348818b524a071a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deliveries" DROP CONSTRAINT "FK_bfa72a4a1d9342407a88d2467b3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "deliveries" DROP CONSTRAINT "FK_789dba7900f6d25550280ad3b93"`,
    );
    await queryRunner.query(
      `ALTER TABLE "riders" DROP CONSTRAINT "FK_4098ce731448bcaac94b1c9b025"`,
    );
    await queryRunner.query(
      `ALTER TABLE "riders" DROP CONSTRAINT "FK_8d3d41e9ec12eff82b325fa8c07"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" DROP CONSTRAINT "FK_53d597384719e04ff18d02f5a9f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" DROP CONSTRAINT "FK_ad4336ea52ca96a9094a76cd9f3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" DROP CONSTRAINT "FK_ede780fc2b865d1d1323e598038"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" DROP CONSTRAINT "FK_6385a745d9e12a89b859bb25623"`,
    );
    await queryRunner.query(
      `ALTER TABLE "carts" DROP CONSTRAINT "FK_2ec1c94a977b940d85a4f498aea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_ticket_notes" DROP CONSTRAINT "FK_31f50e4aadf281b5d2ecb46e79e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_ticket_notes" DROP CONSTRAINT "FK_ce997a05626cd5a5861ca288dda"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" DROP CONSTRAINT "FK_1497d97a1193ff937dea51ac1ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" DROP CONSTRAINT "FK_6d258c19816e99102e2aabcd7be"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" DROP CONSTRAINT "FK_4c3a306f404bff5817f37d46616"`,
    );
    await queryRunner.query(
      `ALTER TABLE "support_tickets" DROP CONSTRAINT "FK_0b1eb4f1f984aab3c481c48468a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_116b47417d5344f6a10cc8370e7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_9482e9567d8dcc2bc615981ef44"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_b8002ad83c018f58beac46dee3f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "return_items" DROP CONSTRAINT "FK_c57d201363c110de07d1fd32027"`,
    );
    await queryRunner.query(
      `ALTER TABLE "return_items" DROP CONSTRAINT "FK_f94d86e7bffa6494f57d9263a4a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "return_requests" DROP CONSTRAINT "FK_d41ab0aabff469545a236887561"`,
    );
    await queryRunner.query(
      `ALTER TABLE "return_requests" DROP CONSTRAINT "FK_e432a7251bc55359ce655fcc92d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_order_events" DROP CONSTRAINT "FK_68dc0631f465594a95a613771d2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_order_events" DROP CONSTRAINT "FK_c2fbb6cd945aebdd9565e9c9afd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_7fb93ff11c54ec4bb71c78c2fe5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_4094d4ef12f2b0d8f24e65a9ca7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_db2d0ea722e16e0fe8ab3bce111"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_ce507559d955e3fdb64a4b6ccb0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_orders" DROP CONSTRAINT "FK_d6598b76bf90c1f53ef7dea2e3c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_orders" DROP CONSTRAINT "FK_c67c3ed4f24af42648fac17e0f0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_orders" DROP CONSTRAINT "FK_4f82b4416535d33ed5d93b48a31"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_6284f0f60e4cb96c12ff96f0f15"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "gift_card_transactions" DROP CONSTRAINT "FK_d0b40340d3fd81c1d7bb20dcc59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "gift_card_transactions" DROP CONSTRAINT "FK_06aa31c15a76f1463637b07420f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "gift_cards" DROP CONSTRAINT "FK_249a496fb5f09086203b0abe882"`,
    );
    await queryRunner.query(
      `ALTER TABLE "gift_cards" DROP CONSTRAINT "FK_c8ed925445accc3214771e79ca1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" DROP CONSTRAINT "FK_986f8dd830915cf2835f89709df"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" DROP CONSTRAINT "FK_adb70aa4959d5b2676fa4fde836"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" DROP CONSTRAINT "FK_9df1b9bc48e3eea5da3762f8e56"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupons" DROP CONSTRAINT "FK_93bf51b012602022d0002d2162b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coupons" DROP CONSTRAINT "FK_2a066f63c9dc8cf6094017b6938"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_785fecd3c7dbf760fbabeb6a959"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_a6af79f5f202f7e228839b71c8c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23"`,
    );
    await queryRunner.query(
      `ALTER TABLE "price_offers" DROP CONSTRAINT "FK_de203ed1e53a112cc5faa919d55"`,
    );
    await queryRunner.query(
      `ALTER TABLE "price_offers" DROP CONSTRAINT "FK_36609f33f77e0540338c8d9445b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "price_offers" DROP CONSTRAINT "FK_a7a298f6bde213a5db57893da35"`,
    );
    await queryRunner.query(
      `ALTER TABLE "price_offers" DROP CONSTRAINT "FK_69fb52f856f07fc7305ccee01ad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "price_offers" DROP CONSTRAINT "FK_326165f31a5197bb0d8f3d34b41"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_22fbbb93632ee571505fd76a6bd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_c9f0434c15cacf894e996f69088"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_follows" DROP CONSTRAINT "FK_a14449637075fecc1aa160d7264"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_follows" DROP CONSTRAINT "FK_6e86e74bd2eb0cb9d4f37f71e1b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" DROP CONSTRAINT "FK_177397e044732e7e9c0215cd5b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_items" DROP CONSTRAINT "FK_549f44d8b756e2690deb099f83b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_4a137ccc372acb73821c4dd3991"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_1bb851d7c7ef2435fad91cae453"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_7645bd68229997627f7b2191687"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_variants" DROP CONSTRAINT "FK_6343513e20e2deab45edfce1316"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_c1af9b47239151e255f62e03247"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_a2916070ca16e6ec248258c33c9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_1530a6f15d3c79d1b70be98f2be"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_9e952e93f369f16e27dd786c33f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "size_charts" DROP CONSTRAINT "FK_a368b6ab812d967cf3dbf1ab870"`,
    );
    await queryRunner.query(
      `ALTER TABLE "size_charts" DROP CONSTRAINT "FK_63e876d56be41cdcc6c0bf4fd5c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_88cea2dc9c31951d06437879b40"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_payout_accounts" DROP CONSTRAINT "FK_de5fe1066db7e38e4ebf4fba58e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_verifications" DROP CONSTRAINT "FK_f1c4af95cc49f455e997cd6725d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_verifications" DROP CONSTRAINT "FK_db05a3df11011f0f3629084b9b8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_hours" DROP CONSTRAINT "FK_776e3aa2451c33f8f6632d09732"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_categories" DROP CONSTRAINT "FK_ee4fccaada563c04413b8916d07"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_categories" DROP CONSTRAINT "FK_2538b463070f40928e80f0d028c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_members" DROP CONSTRAINT "FK_f0147e76ed9a1c177f667304dfc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shop_members" DROP CONSTRAINT "FK_721a7b3720a5e1e3a0fabc914d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shops" DROP CONSTRAINT "FK_af2e847d1cc4112327381d5bc7e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shops" DROP CONSTRAINT "FK_2c0d65f24ec5d3c9a54f99e1529"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shops" DROP CONSTRAINT "FK_4bb54d4b454fbfc410e2917691a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shops" DROP CONSTRAINT "FK_342c0e88448b150aade000d453e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shops" DROP CONSTRAINT "FK_db81021849f3006faad9b2242c8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pickup_points" DROP CONSTRAINT "FK_f6f48129fcb8d6c1f9290a7fce8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pickup_points" DROP CONSTRAINT "FK_0a3c7a707500291fedca9b8f343"`,
    );
    await queryRunner.query(
      `ALTER TABLE "market_members" DROP CONSTRAINT "FK_daf3c24d1f5abf726abbea06778"`,
    );
    await queryRunner.query(
      `ALTER TABLE "market_members" DROP CONSTRAINT "FK_45911c0296b23bb57bb2595db77"`,
    );
    await queryRunner.query(
      `ALTER TABLE "market_floors" DROP CONSTRAINT "FK_f21491d640498f453bd4efc5957"`,
    );
    await queryRunner.query(
      `ALTER TABLE "markets" DROP CONSTRAINT "FK_73ad85f11339e35001e60a44fc7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "markets" DROP CONSTRAINT "FK_d264561c1d0860970b7ca2658ff"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" DROP CONSTRAINT "FK_3c9b4d155e1f5cc98d6b7063050"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_addresses" DROP CONSTRAINT "FK_7a5100ce0548ef27a6f1533a5ce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_devices" DROP CONSTRAINT "FK_28bd79e1b3f7c1168f0904ce241"`,
    );
    await queryRunner.query(
      `ALTER TABLE "platform_staff" DROP CONSTRAINT "FK_7b9efb95cf7853b29f57d22e277"`,
    );
    await queryRunner.query(
      `ALTER TABLE "areas" DROP CONSTRAINT "FK_0133ab4e71f1069d0db0655f2e5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "districts" DROP CONSTRAINT "FK_b0f53665358e2fee2fd290d115f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cc9358bf81fd343b8fa699787b"`,
    );
    await queryRunner.query(`DROP TABLE "ad_campaigns"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4212d63aba732f01c6c995becf"`,
    );
    await queryRunner.query(`DROP TABLE "shop_ledger_entries"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_988477d139271e5f88e32eb224"`,
    );
    await queryRunner.query(`DROP TABLE "shop_payouts"`);
    await queryRunner.query(
      `DROP INDEX "public"."UQ_shop_subscriptions_one_current"`,
    );
    await queryRunner.query(`DROP TABLE "shop_subscriptions"`);
    await queryRunner.query(`DROP TABLE "subscription_plans"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0a3ef3a3d31b8658fc1c895b17"`,
    );
    await queryRunner.query(`DROP TABLE "commission_rules"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4e7e9456e13d26f5a005bdc383"`,
    );
    await queryRunner.query(`DROP TABLE "import_jobs"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7421efc125d95e413657efa3c6"`,
    );
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4981129d48833f45cc3e70f06b"`,
    );
    await queryRunner.query(`DROP TABLE "search_queries"`);
    await queryRunner.query(`DROP TABLE "platform_settings"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_310667f935698fcd8cb319113a"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7f48aa5d56c42aeb495db01668"`,
    );
    await queryRunner.query(`DROP TABLE "refunds"`);
    await queryRunner.query(`DROP TABLE "payment_webhook_events"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b2f7b823a21562eeca20e72b00"`,
    );
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TABLE "delivery_shop_orders"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2a761d0390e33990ab5862bbbe"`,
    );
    await queryRunner.query(`DROP TABLE "deliveries"`);
    await queryRunner.query(`DROP TABLE "riders"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ede780fc2b865d1d1323e59803"`,
    );
    await queryRunner.query(`DROP TABLE "cart_items"`);
    await queryRunner.query(`DROP TABLE "carts"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ce997a05626cd5a5861ca288dd"`,
    );
    await queryRunner.query(`DROP TABLE "support_ticket_notes"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_11d8635c21eeba3de3e8769424"`,
    );
    await queryRunner.query(`DROP TABLE "support_tickets"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_59b38438ffca2178e770920167"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9482e9567d8dcc2bc615981ef4"`,
    );
    await queryRunner.query(`DROP TABLE "reviews"`);
    await queryRunner.query(`DROP TABLE "return_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e432a7251bc55359ce655fcc92"`,
    );
    await queryRunner.query(`DROP TABLE "return_requests"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dfd059abfd04acb470d27822d4"`,
    );
    await queryRunner.query(`DROP TABLE "shop_order_events"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_db2d0ea722e16e0fe8ab3bce11"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ce507559d955e3fdb64a4b6ccb"`,
    );
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_shop_orders_shop_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_shop_orders_reserved_until"`,
    );
    await queryRunner.query(`DROP TABLE "shop_orders"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_11fefa35e3ef25881234b8b89a"`,
    );
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_06aa31c15a76f1463637b07420"`,
    );
    await queryRunner.query(`DROP TABLE "gift_card_transactions"`);
    await queryRunner.query(`DROP TABLE "gift_cards"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dd4cda7c82246e92c50453fda3"`,
    );
    await queryRunner.query(`DROP TABLE "coupon_redemptions"`);
    await queryRunner.query(`DROP TABLE "coupons"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8584a1974e1ca95f4861d975ff"`,
    );
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_389ead41c18f28080df485f3fc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_682c3bb53ffb9f45ddf5d959ba"`,
    );
    await queryRunner.query(`DROP TABLE "price_offers"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cd14e743131cc940bce9124fa7"`,
    );
    await queryRunner.query(`DROP TABLE "conversations"`);
    await queryRunner.query(`DROP TABLE "shop_follows"`);
    await queryRunner.query(`DROP TABLE "wishlist_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_38e2f32be31de92b8cec259304"`,
    );
    await queryRunner.query(`DROP TABLE "inventory_movements"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7d5349c9553f4b30ad8aef0b37"`,
    );
    await queryRunner.query(`DROP TABLE "product_images"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6343513e20e2deab45edfce131"`,
    );
    await queryRunner.query(`DROP TABLE "product_variants"`);
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`,
      [
        'GENERATED_COLUMN',
        'available_qty',
        'cholo_market',
        'public',
        'product_variants',
      ],
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_products_shop_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_products_category_status"`,
    );
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`,
      [
        'GENERATED_COLUMN',
        'search_vector',
        'cholo_market',
        'public',
        'products',
      ],
    );
    await queryRunner.query(`DROP TABLE "size_charts"`);
    await queryRunner.query(`DROP TABLE "brands"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_88cea2dc9c31951d06437879b4"`,
    );
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(
      `DROP INDEX "public"."UQ_shop_payout_accounts_one_default"`,
    );
    await queryRunner.query(`DROP TABLE "shop_payout_accounts"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a651bd564c34e63abbcf110129"`,
    );
    await queryRunner.query(`DROP TABLE "shop_verifications"`);
    await queryRunner.query(`DROP TABLE "shop_hours"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ee4fccaada563c04413b8916d0"`,
    );
    await queryRunner.query(`DROP TABLE "shop_categories"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f0147e76ed9a1c177f667304df"`,
    );
    await queryRunner.query(`DROP TABLE "shop_members"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_shops_walk"`);
    await queryRunner.query(`DROP INDEX "public"."UQ_shops_market_number"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2c0d65f24ec5d3c9a54f99e152"`,
    );
    await queryRunner.query(`DROP TABLE "shops"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0a3c7a707500291fedca9b8f34"`,
    );
    await queryRunner.query(`DROP TABLE "pickup_points"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_daf3c24d1f5abf726abbea0677"`,
    );
    await queryRunner.query(`DROP TABLE "market_members"`);
    await queryRunner.query(`DROP TABLE "market_floors"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d264561c1d0860970b7ca2658f"`,
    );
    await queryRunner.query(`DROP TABLE "markets"`);
    await queryRunner.query(
      `DROP INDEX "public"."UQ_user_addresses_one_default"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7a5100ce0548ef27a6f1533a5c"`,
    );
    await queryRunner.query(`DROP TABLE "user_addresses"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_28bd79e1b3f7c1168f0904ce24"`,
    );
    await queryRunner.query(`DROP TABLE "user_devices"`);
    await queryRunner.query(`DROP TABLE "platform_staff"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "areas"`);
    await queryRunner.query(`DROP TABLE "districts"`);
    await queryRunner.query(`DROP TABLE "divisions"`);
  }
}
