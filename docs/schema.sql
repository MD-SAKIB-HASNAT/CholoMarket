--
-- PostgreSQL database dump
--

\restrict 06XhPdrpW5SmWeyNayklEGZlZiPy4sa94ijyeO264UbofWdQERB9AvnpiGFaThu

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ad_campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_campaigns (
    id integer NOT NULL,
    advertiser character varying(10) NOT NULL,
    shop_id integer,
    market_id integer,
    product_id integer,
    placement character varying(20) NOT NULL,
    category_id integer,
    title text,
    image_url text,
    price numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    status character varying(15) DEFAULT 'scheduled'::character varying NOT NULL,
    impressions bigint DEFAULT '0'::bigint NOT NULL,
    clicks bigint DEFAULT '0'::bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    subtitle text,
    link_url text,
    mobile_image_url text,
    image_has_text boolean DEFAULT false NOT NULL,
    CONSTRAINT "CHK_ad_campaigns_advertiser" CHECK (((advertiser)::text = ANY ((ARRAY['shop'::character varying, 'market'::character varying, 'brand'::character varying, 'external'::character varying])::text[]))),
    CONSTRAINT "CHK_ad_campaigns_placement" CHECK (((placement)::text = ANY ((ARRAY['home_banner'::character varying, 'search_top'::character varying, 'category_top'::character varying, 'market_featured'::character varying, 'market_sponsor'::character varying])::text[]))),
    CONSTRAINT "CHK_ad_campaigns_status" CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'scheduled'::character varying, 'running'::character varying, 'ended'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: ad_campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.ad_campaigns ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ad_campaigns_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: areas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.areas (
    id integer NOT NULL,
    district_id smallint NOT NULL,
    name_en text NOT NULL,
    name_bn text NOT NULL,
    kind character varying(20) DEFAULT 'thana'::character varying NOT NULL,
    is_serviceable boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT "CHK_areas_kind" CHECK (((kind)::text = ANY ((ARRAY['thana'::character varying, 'upazila'::character varying, 'city_area'::character varying])::text[])))
);


--
-- Name: areas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.areas ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.areas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    actor_id integer,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id integer,
    changes jsonb,
    ip_address inet,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brands (
    id integer NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    logo_url text
);


--
-- Name: brands_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.brands ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.brands_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id integer NOT NULL,
    cart_id integer NOT NULL,
    variant_id integer NOT NULL,
    shop_id integer NOT NULL,
    quantity integer NOT NULL,
    offer_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_cart_items_qty" CHECK ((quantity > 0))
);


--
-- Name: cart_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cart_items ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.cart_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carts (
    id integer NOT NULL,
    user_id integer,
    guest_token uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_carts_owner" CHECK (((user_id IS NOT NULL) OR (guest_token IS NOT NULL)))
);


--
-- Name: carts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.carts ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.carts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    parent_id integer,
    slug text NOT NULL,
    name_en text NOT NULL,
    name_bn text NOT NULL,
    icon text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    image_url text
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.categories ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: commission_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commission_rules (
    id integer NOT NULL,
    category_id integer,
    market_id integer,
    shop_id integer,
    rate numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    valid_from timestamp with time zone NOT NULL,
    valid_to timestamp with time zone,
    note text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_commission_rules_rate" CHECK (((rate >= (0)::numeric) AND (rate <= (100)::numeric)))
);


--
-- Name: commission_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.commission_rules ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.commission_rules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    shop_id integer NOT NULL,
    last_message_at timestamp with time zone,
    last_message_preview text,
    customer_unread integer DEFAULT 0 NOT NULL,
    shop_unread integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.conversations ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.conversations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: coupon_redemptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupon_redemptions (
    id integer NOT NULL,
    coupon_id integer NOT NULL,
    order_id integer NOT NULL,
    user_id integer NOT NULL,
    discount_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: coupon_redemptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.coupon_redemptions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.coupon_redemptions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupons (
    id integer NOT NULL,
    code text NOT NULL,
    funded_by character varying(10) NOT NULL,
    shop_id integer,
    market_id integer,
    discount_type character varying(10) NOT NULL,
    discount_value numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    max_discount numeric(12,2),
    min_order_total numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    usage_limit integer,
    per_user_limit integer DEFAULT 1 NOT NULL,
    used_count integer DEFAULT 0 NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_coupons_funder" CHECK (((funded_by)::text = ANY ((ARRAY['platform'::character varying, 'shop'::character varying, 'market'::character varying])::text[]))),
    CONSTRAINT "CHK_coupons_type" CHECK (((discount_type)::text = ANY ((ARRAY['percent'::character varying, 'fixed'::character varying])::text[]))),
    CONSTRAINT "CHK_coupons_value" CHECK ((discount_value > (0)::numeric))
);


--
-- Name: coupons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.coupons ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.coupons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: courier_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courier_accounts (
    id integer NOT NULL,
    shop_id integer NOT NULL,
    provider character varying(20) NOT NULL,
    mode character varying(10) DEFAULT 'mock'::character varying NOT NULL,
    label text NOT NULL,
    api_key text,
    secret_key text,
    key_hint character varying(8),
    is_default boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_checked_at timestamp with time zone,
    last_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_courier_accounts_mode" CHECK (((mode)::text = ANY ((ARRAY['mock'::character varying, 'live'::character varying])::text[]))),
    CONSTRAINT "CHK_courier_accounts_provider" CHECK (((provider)::text = 'steadfast'::text))
);


--
-- Name: courier_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.courier_accounts ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.courier_accounts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: deliveries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deliveries (
    id integer NOT NULL,
    order_id integer NOT NULL,
    hub_id integer NOT NULL,
    rider_id integer,
    address jsonb NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    fee numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    rider_earning numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    cod_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    delivery_otp character varying(6),
    proof_photo_url text,
    assigned_at timestamp with time zone,
    delivered_at timestamp with time zone,
    failure_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_deliveries_status" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'assigned'::character varying, 'collecting'::character varying, 'at_hub'::character varying, 'out_for_delivery'::character varying, 'delivered'::character varying, 'failed'::character varying, 'returned'::character varying])::text[])))
);


--
-- Name: deliveries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.deliveries ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.deliveries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: delivery_shop_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delivery_shop_orders (
    delivery_id integer NOT NULL,
    shop_order_id integer NOT NULL,
    collected_at timestamp with time zone
);


--
-- Name: districts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.districts (
    id smallint NOT NULL,
    division_id smallint NOT NULL,
    name_en text NOT NULL,
    name_bn text NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: districts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.districts ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.districts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: divisions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.divisions (
    id smallint NOT NULL,
    name_en text NOT NULL,
    name_bn text NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: divisions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.divisions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.divisions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: gift_card_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gift_card_transactions (
    id integer NOT NULL,
    gift_card_id integer NOT NULL,
    order_id integer,
    kind character varying(10) NOT NULL,
    amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_gift_card_tx_kind" CHECK (((kind)::text = ANY ((ARRAY['issue'::character varying, 'redeem'::character varying, 'refund'::character varying, 'adjust'::character varying])::text[])))
);


--
-- Name: gift_card_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.gift_card_transactions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.gift_card_transactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: gift_cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gift_cards (
    id integer NOT NULL,
    code text NOT NULL,
    market_id integer,
    initial_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    balance numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    purchased_by integer,
    owner_id integer,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_gift_cards_amounts" CHECK (((initial_amount > (0)::numeric) AND (balance >= (0)::numeric))),
    CONSTRAINT "CHK_gift_cards_status" CHECK (((status)::text = ANY ((ARRAY['inactive'::character varying, 'active'::character varying, 'exhausted'::character varying, 'expired'::character varying, 'blocked'::character varying])::text[])))
);


--
-- Name: gift_cards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.gift_cards ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.gift_cards_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: import_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.import_jobs (
    id integer NOT NULL,
    shop_id integer NOT NULL,
    created_by integer NOT NULL,
    file_name text NOT NULL,
    status character varying(15) DEFAULT 'queued'::character varying NOT NULL,
    total_rows integer DEFAULT 0 NOT NULL,
    created_count integer DEFAULT 0 NOT NULL,
    updated_count integer DEFAULT 0 NOT NULL,
    failed_count integer DEFAULT 0 NOT NULL,
    errors jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    finished_at timestamp with time zone,
    CONSTRAINT "CHK_import_jobs_status" CHECK (((status)::text = ANY ((ARRAY['queued'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))
);


--
-- Name: import_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.import_jobs ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.import_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: inventory_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_movements (
    id bigint NOT NULL,
    variant_id integer NOT NULL,
    stock_change integer DEFAULT 0 NOT NULL,
    reserved_change integer DEFAULT 0 NOT NULL,
    reason character varying(20) NOT NULL,
    order_item_id integer,
    note text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_inventory_movements_reason" CHECK (((reason)::text = ANY ((ARRAY['restock'::character varying, 'manual_adjust'::character varying, 'offline_sale'::character varying, 'reserve'::character varying, 'release'::character varying, 'online_sale'::character varying, 'return'::character varying, 'damaged'::character varying, 'import'::character varying])::text[])))
);


--
-- Name: inventory_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.inventory_movements ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.inventory_movements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: market_floors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_floors (
    id integer NOT NULL,
    market_id integer NOT NULL,
    level smallint NOT NULL,
    name_en text NOT NULL,
    name_bn text,
    map_image_url text
);


--
-- Name: market_floors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.market_floors ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.market_floors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: market_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_members (
    market_id integer NOT NULL,
    user_id integer NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_market_members_role" CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'manager'::character varying, 'desk_staff'::character varying])::text[])))
);


--
-- Name: markets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.markets (
    id integer NOT NULL,
    slug text NOT NULL,
    name_en text NOT NULL,
    name_bn text NOT NULL,
    kind character varying(20) NOT NULL,
    description text,
    area_id integer NOT NULL,
    address_line text NOT NULL,
    latitude numeric(9,6),
    longitude numeric(9,6),
    logo_url text,
    cover_url text,
    opens_at time without time zone,
    closes_at time without time zone,
    weekly_off_day smallint,
    is_partner boolean DEFAULT false NOT NULL,
    partner_since date,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    sub_area_id integer,
    CONSTRAINT "CHK_markets_kind" CHECK (((kind)::text = ANY ((ARRAY['mall'::character varying, 'market'::character varying, 'bazaar'::character varying, 'wholesale_market'::character varying, 'street_market'::character varying])::text[]))),
    CONSTRAINT "CHK_markets_off_day" CHECK (((weekly_off_day >= 0) AND (weekly_off_day <= 6))),
    CONSTRAINT "CHK_markets_status" CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'active'::character varying, 'inactive'::character varying])::text[])))
);


--
-- Name: markets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.markets ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.markets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id bigint NOT NULL,
    conversation_id integer NOT NULL,
    sender_id integer NOT NULL,
    sender_side character varying(10) NOT NULL,
    body text,
    attachment_url text,
    product_id integer,
    offer_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone,
    CONSTRAINT "CHK_messages_side" CHECK (((sender_side)::text = ANY ((ARRAY['customer'::character varying, 'shop'::character varying, 'system'::character varying])::text[])))
);


--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.messages ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    kind character varying(40) NOT NULL,
    title text NOT NULL,
    body text,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    channels text[] DEFAULT '{in_app}'::text[] NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.notifications ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    shop_order_id integer NOT NULL,
    variant_id integer NOT NULL,
    product_id integer NOT NULL,
    product_name text NOT NULL,
    variant_label text,
    sku text,
    image_url text,
    category_id integer NOT NULL,
    list_price numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    unit_price numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    quantity integer NOT NULL,
    line_total numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    offer_id integer,
    commission_rate numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    commission_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    returned_qty integer DEFAULT 0 NOT NULL,
    CONSTRAINT "CHK_order_items_line" CHECK ((line_total = (unit_price * (quantity)::numeric))),
    CONSTRAINT "CHK_order_items_qty" CHECK ((quantity > 0)),
    CONSTRAINT "CHK_order_items_returned" CHECK (((returned_qty >= 0) AND (returned_qty <= quantity))),
    CONSTRAINT "CHK_order_items_status" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'cancelled'::character varying, 'returned'::character varying, 'partially_returned'::character varying])::text[])))
);


--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.order_items ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.order_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    order_no text NOT NULL,
    customer_id integer NOT NULL,
    contact_name text NOT NULL,
    contact_phone character varying(14) NOT NULL,
    status character varying(25) DEFAULT 'pending_payment'::character varying NOT NULL,
    payment_status character varying(25) DEFAULT 'unpaid'::character varying NOT NULL,
    subtotal numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    discount_total numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    pickup_fee numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    delivery_fee numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    grand_total numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    amount_due_online numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    amount_paid numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    coupon_id integer,
    delivery_address jsonb,
    customer_note text,
    placed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_orders_payment_status" CHECK (((payment_status)::text = ANY ((ARRAY['unpaid'::character varying, 'deposit_paid'::character varying, 'paid'::character varying, 'partially_refunded'::character varying, 'refunded'::character varying])::text[]))),
    CONSTRAINT "CHK_orders_status" CHECK (((status)::text = ANY ((ARRAY['pending_payment'::character varying, 'placed'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'partially_completed'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT "CHK_orders_total" CHECK ((grand_total = (((subtotal - discount_total) + pickup_fee) + delivery_fee)))
);


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.orders ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: payment_webhook_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_webhook_events (
    id integer NOT NULL,
    gateway character varying(20) NOT NULL,
    event_id text NOT NULL,
    payload jsonb NOT NULL,
    received_at timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone,
    error text
);


--
-- Name: payment_webhook_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.payment_webhook_events ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.payment_webhook_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    order_id integer NOT NULL,
    shop_order_id integer,
    method character varying(15) NOT NULL,
    purpose character varying(10) NOT NULL,
    amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    status character varying(15) DEFAULT 'initiated'::character varying NOT NULL,
    gateway character varying(20),
    gateway_payment_id text,
    gateway_trx_id text,
    payer_account text,
    collected_by integer,
    gateway_response jsonb,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_payments_amount" CHECK ((amount > (0)::numeric)),
    CONSTRAINT "CHK_payments_method" CHECK (((method)::text = ANY ((ARRAY['bkash'::character varying, 'nagad'::character varying, 'card'::character varying, 'cash'::character varying, 'gift_card'::character varying])::text[]))),
    CONSTRAINT "CHK_payments_purpose" CHECK (((purpose)::text = ANY ((ARRAY['full'::character varying, 'deposit'::character varying, 'balance'::character varying])::text[]))),
    CONSTRAINT "CHK_payments_status" CHECK (((status)::text = ANY ((ARRAY['initiated'::character varying, 'pending'::character varying, 'succeeded'::character varying, 'failed'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.payments ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.payments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: pickup_points; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pickup_points (
    id integer NOT NULL,
    market_id integer NOT NULL,
    floor_id integer,
    name_en text NOT NULL,
    name_bn text,
    instructions text,
    opens_at time without time zone,
    closes_at time without time zone,
    is_hub boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pickup_points_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.pickup_points ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.pickup_points_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: platform_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_settings (
    key text NOT NULL,
    value jsonb NOT NULL,
    updated_by integer,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: platform_staff; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_staff (
    user_id integer NOT NULL,
    role character varying(20) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_platform_staff_role" CHECK (((role)::text = ANY ((ARRAY['super_admin'::character varying, 'ops'::character varying, 'onboarding'::character varying, 'support'::character varying, 'finance'::character varying])::text[])))
);


--
-- Name: price_offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_offers (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    customer_id integer NOT NULL,
    shop_id integer NOT NULL,
    variant_id integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    list_price numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    offered_price numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    counter_price numeric(12,2),
    final_price numeric(12,2),
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    responded_by integer,
    responded_at timestamp with time zone,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_price_offers_price" CHECK ((offered_price > (0)::numeric)),
    CONSTRAINT "CHK_price_offers_qty" CHECK ((quantity > 0)),
    CONSTRAINT "CHK_price_offers_status" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'countered'::character varying, 'accepted'::character varying, 'rejected'::character varying, 'withdrawn'::character varying, 'expired'::character varying, 'used'::character varying])::text[])))
);


--
-- Name: price_offers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.price_offers ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.price_offers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: product_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_images (
    id integer NOT NULL,
    product_id integer NOT NULL,
    variant_id integer,
    url text NOT NULL,
    sort_order smallint DEFAULT '0'::smallint NOT NULL
);


--
-- Name: product_images_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.product_images ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.product_images_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_variants (
    id integer NOT NULL,
    product_id integer NOT NULL,
    sku text,
    barcode text,
    attributes jsonb DEFAULT '{}'::jsonb NOT NULL,
    price numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    compare_at_price numeric(12,2),
    min_offer_price numeric(12,2),
    stock_qty integer DEFAULT 0 NOT NULL,
    reserved_qty integer DEFAULT 0 NOT NULL,
    available_qty integer GENERATED ALWAYS AS ((stock_qty - reserved_qty)) STORED NOT NULL,
    low_stock_threshold integer DEFAULT 2 NOT NULL,
    stock_updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_variants_price" CHECK ((price >= (0)::numeric)),
    CONSTRAINT "CHK_variants_reserved" CHECK (((reserved_qty >= 0) AND (reserved_qty <= stock_qty))),
    CONSTRAINT "CHK_variants_stock" CHECK ((stock_qty >= 0))
);


--
-- Name: product_variants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.product_variants ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.product_variants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id integer NOT NULL,
    shop_id integer NOT NULL,
    category_id integer NOT NULL,
    brand_id integer,
    size_chart_id integer,
    slug text NOT NULL,
    name_en text NOT NULL,
    name_bn text,
    description text,
    condition character varying(20) DEFAULT 'new'::character varying NOT NULL,
    warranty_type character varying(20) DEFAULT 'none'::character varying NOT NULL,
    warranty_months smallint,
    is_negotiable boolean DEFAULT false NOT NULL,
    min_price numeric(12,2),
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    rating_avg numeric(3,2) DEFAULT '0'::numeric NOT NULL,
    rating_count integer DEFAULT 0 NOT NULL,
    search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple'::regconfig, ((((COALESCE(name_en, ''::text) || ' '::text) || COALESCE(name_bn, ''::text)) || ' '::text) || COALESCE(description, ''::text)))) STORED NOT NULL,
    created_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT "CHK_products_condition" CHECK (((condition)::text = ANY ((ARRAY['new'::character varying, 'used'::character varying, 'refurbished'::character varying])::text[]))),
    CONSTRAINT "CHK_products_status" CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'active'::character varying, 'hidden'::character varying, 'archived'::character varying])::text[]))),
    CONSTRAINT "CHK_products_warranty" CHECK (((warranty_type)::text = ANY ((ARRAY['none'::character varying, 'shop'::character varying, 'brand_official'::character varying])::text[])))
);


--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.products ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.products_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: refunds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refunds (
    id integer NOT NULL,
    payment_id integer NOT NULL,
    shop_order_id integer,
    return_request_id integer,
    amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    reason text,
    status character varying(15) DEFAULT 'pending'::character varying NOT NULL,
    gateway_refund_id text,
    processed_by integer,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_refunds_amount" CHECK ((amount > (0)::numeric)),
    CONSTRAINT "CHK_refunds_status" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'succeeded'::character varying, 'failed'::character varying])::text[])))
);


--
-- Name: refunds_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.refunds ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.refunds_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: return_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.return_items (
    return_request_id integer NOT NULL,
    order_item_id integer NOT NULL,
    quantity integer NOT NULL,
    CONSTRAINT "CHK_return_items_qty" CHECK ((quantity > 0))
);


--
-- Name: return_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.return_requests (
    id integer NOT NULL,
    shop_order_id integer NOT NULL,
    customer_id integer NOT NULL,
    reason character varying(20) NOT NULL,
    details text,
    photo_urls text[] DEFAULT '{}'::text[] NOT NULL,
    resolution character varying(20),
    status character varying(20) DEFAULT 'requested'::character varying NOT NULL,
    reviewed_by integer,
    reviewed_at timestamp with time zone,
    shop_note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_return_requests_reason" CHECK (((reason)::text = ANY ((ARRAY['wrong_size'::character varying, 'defective'::character varying, 'not_as_described'::character varying, 'wrong_item'::character varying, 'changed_mind'::character varying, 'warranty_claim'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT "CHK_return_requests_resolution" CHECK (((resolution IS NULL) OR ((resolution)::text = ANY ((ARRAY['refund'::character varying, 'exchange'::character varying, 'store_credit'::character varying, 'repair'::character varying])::text[])))),
    CONSTRAINT "CHK_return_requests_status" CHECK (((status)::text = ANY ((ARRAY['requested'::character varying, 'approved'::character varying, 'rejected'::character varying, 'item_received'::character varying, 'resolved'::character varying])::text[])))
);


--
-- Name: return_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.return_requests ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.return_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    user_id integer NOT NULL,
    shop_id integer NOT NULL,
    product_id integer,
    shop_order_id integer NOT NULL,
    rating smallint NOT NULL,
    comment text,
    photo_urls text[] DEFAULT '{}'::text[] NOT NULL,
    shop_reply text,
    shop_replied_at timestamp with time zone,
    status character varying(15) DEFAULT 'published'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_reviews_rating" CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT "CHK_reviews_status" CHECK (((status)::text = ANY ((ARRAY['published'::character varying, 'hidden'::character varying])::text[])))
);


--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.reviews ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.reviews_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: riders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.riders (
    user_id integer NOT NULL,
    home_hub_id integer,
    vehicle_type character varying(10) NOT NULL,
    nid_verified boolean DEFAULT false NOT NULL,
    status character varying(15) DEFAULT 'offline'::character varying NOT NULL,
    last_latitude numeric(9,6),
    last_longitude numeric(9,6),
    last_seen_at timestamp with time zone,
    cash_in_hand numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_riders_status" CHECK (((status)::text = ANY ((ARRAY['offline'::character varying, 'available'::character varying, 'busy'::character varying, 'suspended'::character varying])::text[]))),
    CONSTRAINT "CHK_riders_vehicle" CHECK (((vehicle_type)::text = ANY ((ARRAY['bicycle'::character varying, 'motorbike'::character varying, 'van'::character varying])::text[])))
);


--
-- Name: search_queries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.search_queries (
    id bigint NOT NULL,
    user_id integer,
    query text NOT NULL,
    scope character varying(10) NOT NULL,
    market_id integer,
    results_count integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_search_queries_scope" CHECK (((scope)::text = ANY ((ARRAY['all'::character varying, 'market'::character varying, 'shop'::character varying, 'product'::character varying])::text[])))
);


--
-- Name: search_queries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.search_queries ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.search_queries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: shipment_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shipment_events (
    id bigint NOT NULL,
    shipment_id integer NOT NULL,
    status character varying(20) NOT NULL,
    courier_status text,
    source character varying(10) NOT NULL,
    message text,
    raw jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: shipment_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.shipment_events ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.shipment_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: shipments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shipments (
    id integer NOT NULL,
    shop_order_id integer NOT NULL,
    shop_id integer NOT NULL,
    courier_account_id integer NOT NULL,
    provider character varying(20) NOT NULL,
    invoice text NOT NULL,
    consignment_id text NOT NULL,
    tracking_code text,
    status character varying(20) DEFAULT 'booked'::character varying NOT NULL,
    courier_status text,
    cod_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    courier_charge numeric(12,2),
    recipient jsonb NOT NULL,
    note text,
    created_by integer,
    delivered_at timestamp with time zone,
    last_synced_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_shipments_provider" CHECK (((provider)::text = 'steadfast'::text)),
    CONSTRAINT "CHK_shipments_status" CHECK (((status)::text = ANY ((ARRAY['booked'::character varying, 'in_transit'::character varying, 'on_hold'::character varying, 'delivered'::character varying, 'partial_delivered'::character varying, 'returned'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: shipments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.shipments ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.shipments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: shop_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_categories (
    shop_id integer NOT NULL,
    category_id integer NOT NULL
);


--
-- Name: shop_follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_follows (
    user_id integer NOT NULL,
    shop_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: shop_hours; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_hours (
    shop_id integer NOT NULL,
    weekday smallint NOT NULL,
    opens_at time without time zone,
    closes_at time without time zone,
    is_closed boolean DEFAULT false NOT NULL,
    CONSTRAINT "CHK_shop_hours_weekday" CHECK (((weekday >= 0) AND (weekday <= 6)))
);


--
-- Name: shop_ledger_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_ledger_entries (
    id integer NOT NULL,
    shop_id integer NOT NULL,
    kind character varying(20) NOT NULL,
    amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    shop_order_id integer,
    refund_id integer,
    payout_id integer,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_shop_ledger_kind" CHECK (((kind)::text = ANY ((ARRAY['sale'::character varying, 'commission'::character varying, 'refund'::character varying, 'payout'::character varying, 'subscription_fee'::character varying, 'ad_fee'::character varying, 'adjustment'::character varying])::text[])))
);


--
-- Name: shop_ledger_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.shop_ledger_entries ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.shop_ledger_entries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: shop_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_members (
    shop_id integer NOT NULL,
    user_id integer NOT NULL,
    role character varying(20) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_shop_members_role" CHECK (((role)::text = ANY ((ARRAY['owner'::character varying, 'manager'::character varying, 'staff'::character varying])::text[])))
);


--
-- Name: shop_order_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_order_events (
    id bigint NOT NULL,
    shop_order_id integer NOT NULL,
    from_status character varying(25),
    to_status character varying(25) NOT NULL,
    actor_id integer,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: shop_order_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.shop_order_events ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.shop_order_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: shop_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_orders (
    id integer NOT NULL,
    order_id integer NOT NULL,
    shop_id integer NOT NULL,
    sub_order_no text NOT NULL,
    status character varying(25) DEFAULT 'placed'::character varying NOT NULL,
    fulfillment_type character varying(20) DEFAULT 'shop_pickup'::character varying NOT NULL,
    pickup_point_id integer,
    pickup_code character varying(6) NOT NULL,
    reserved_until timestamp with time zone,
    subtotal numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    discount_total numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    total numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    commission_total numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    cash_due numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    confirmed_at timestamp with time zone,
    ready_at timestamp with time zone,
    completed_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    cancel_reason text,
    cancelled_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    delivery_fee numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    shipped_at timestamp with time zone,
    CONSTRAINT "CHK_shop_orders_desk" CHECK ((((fulfillment_type)::text <> 'desk_pickup'::text) OR (pickup_point_id IS NOT NULL))),
    CONSTRAINT "CHK_shop_orders_fulfillment" CHECK (((fulfillment_type)::text = ANY ((ARRAY['shop_pickup'::character varying, 'desk_pickup'::character varying, 'delivery'::character varying])::text[]))),
    CONSTRAINT "CHK_shop_orders_status" CHECK (((status)::text = ANY ((ARRAY['placed'::character varying, 'confirmed'::character varying, 'ready_for_pickup'::character varying, 'shipped'::character varying, 'handed_to_rider'::character varying, 'out_for_delivery'::character varying, 'completed'::character varying, 'rejected'::character varying, 'cancelled'::character varying, 'expired'::character varying, 'returned'::character varying])::text[])))
);


--
-- Name: shop_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.shop_orders ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.shop_orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: shop_payout_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_payout_accounts (
    id integer NOT NULL,
    shop_id integer NOT NULL,
    method character varying(10) NOT NULL,
    account_name text NOT NULL,
    account_number text NOT NULL,
    bank_name text,
    branch_name text,
    routing_number text,
    is_default boolean DEFAULT false NOT NULL,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_shop_payout_accounts_method" CHECK (((method)::text = ANY ((ARRAY['bkash'::character varying, 'nagad'::character varying, 'bank'::character varying])::text[])))
);


--
-- Name: shop_payout_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.shop_payout_accounts ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.shop_payout_accounts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: shop_payouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_payouts (
    id integer NOT NULL,
    shop_id integer NOT NULL,
    payout_account_id integer,
    amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    status character varying(15) DEFAULT 'pending'::character varying NOT NULL,
    reference text,
    approved_by integer,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_shop_payouts_amount" CHECK ((amount > (0)::numeric)),
    CONSTRAINT "CHK_shop_payouts_status" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'paid'::character varying, 'failed'::character varying])::text[])))
);


--
-- Name: shop_payouts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.shop_payouts ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.shop_payouts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: shop_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_subscriptions (
    id integer NOT NULL,
    shop_id integer NOT NULL,
    plan_id smallint NOT NULL,
    status character varying(15) NOT NULL,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone,
    auto_renew boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_shop_subscriptions_status" CHECK (((status)::text = ANY ((ARRAY['trial'::character varying, 'active'::character varying, 'past_due'::character varying, 'cancelled'::character varying, 'expired'::character varying])::text[])))
);


--
-- Name: shop_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.shop_subscriptions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.shop_subscriptions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: shop_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_verifications (
    id integer NOT NULL,
    shop_id integer NOT NULL,
    kind character varying(20) NOT NULL,
    document_number text,
    document_url text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    expires_on date,
    reviewed_by integer,
    reviewed_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_shop_verifications_kind" CHECK (((kind)::text = ANY ((ARRAY['trade_license'::character varying, 'owner_nid'::character varying, 'tin'::character varying, 'bin_vat'::character varying, 'physical_visit'::character varying])::text[]))),
    CONSTRAINT "CHK_shop_verifications_status" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'expired'::character varying])::text[])))
);


--
-- Name: shop_verifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.shop_verifications ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.shop_verifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: shops; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shops (
    id integer NOT NULL,
    slug text NOT NULL,
    market_id integer,
    floor_id integer,
    shop_number text,
    block text,
    walk_order integer,
    map_x numeric(6,2),
    map_y numeric(6,2),
    name_en text NOT NULL,
    name_bn text,
    description text,
    logo_url text,
    cover_url text,
    phone character varying(14),
    whatsapp character varying(14),
    area_id integer,
    address_line text,
    latitude numeric(9,6),
    longitude numeric(9,6),
    primary_category_id integer,
    accepts_offers boolean DEFAULT true NOT NULL,
    accepts_cash_on_pickup boolean DEFAULT true NOT NULL,
    deposit_percent numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    reservation_hours smallint DEFAULT '24'::smallint NOT NULL,
    return_window_days smallint DEFAULT '3'::smallint NOT NULL,
    return_policy text,
    warranty_policy text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    verified_at timestamp with time zone,
    rating_avg numeric(3,2) DEFAULT '0'::numeric NOT NULL,
    rating_count integer DEFAULT 0 NOT NULL,
    onboarded_by integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    offers_delivery boolean DEFAULT true NOT NULL,
    CONSTRAINT "CHK_shops_deposit" CHECK (((deposit_percent >= (0)::numeric) AND (deposit_percent <= (100)::numeric))),
    CONSTRAINT "CHK_shops_location" CHECK (((market_id IS NOT NULL) OR (area_id IS NOT NULL))),
    CONSTRAINT "CHK_shops_status" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'suspended'::character varying, 'closed'::character varying])::text[])))
);


--
-- Name: shops_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.shops ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.shops_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: size_charts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.size_charts (
    id integer NOT NULL,
    category_id integer NOT NULL,
    shop_id integer,
    name text NOT NULL,
    chart jsonb NOT NULL
);


--
-- Name: size_charts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.size_charts ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.size_charts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sub_areas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sub_areas (
    id integer NOT NULL,
    area_id integer NOT NULL,
    name_en text NOT NULL,
    name_bn text NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: sub_areas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.sub_areas ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.sub_areas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    id smallint NOT NULL,
    code text NOT NULL,
    name_en text NOT NULL,
    name_bn text NOT NULL,
    monthly_price numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    max_products integer,
    max_staff integer,
    commission_discount numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    features jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: subscription_plans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.subscription_plans ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.subscription_plans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: support_ticket_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_ticket_notes (
    id integer NOT NULL,
    ticket_id integer NOT NULL,
    author_id integer NOT NULL,
    body text NOT NULL,
    is_internal boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: support_ticket_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.support_ticket_notes ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.support_ticket_notes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.support_tickets (
    id integer NOT NULL,
    ticket_no text NOT NULL,
    user_id integer,
    phone character varying(14),
    order_id integer,
    shop_id integer,
    channel character varying(15) NOT NULL,
    category character varying(20) NOT NULL,
    subject text NOT NULL,
    description text,
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    priority character varying(10) DEFAULT 'normal'::character varying NOT NULL,
    assigned_to integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    CONSTRAINT "CHK_support_tickets_category" CHECK (((category)::text = ANY ((ARRAY['order'::character varying, 'payment'::character varying, 'refund'::character varying, 'shop_complaint'::character varying, 'fraud'::character varying, 'account'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT "CHK_support_tickets_channel" CHECK (((channel)::text = ANY ((ARRAY['hotline'::character varying, 'app'::character varying, 'chat'::character varying, 'email'::character varying, 'facebook'::character varying])::text[]))),
    CONSTRAINT "CHK_support_tickets_priority" CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying])::text[]))),
    CONSTRAINT "CHK_support_tickets_status" CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'in_progress'::character varying, 'waiting_customer'::character varying, 'resolved'::character varying, 'closed'::character varying])::text[])))
);


--
-- Name: support_tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.support_tickets ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.support_tickets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: typeorm_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.typeorm_metadata (
    type character varying NOT NULL,
    database character varying,
    schema character varying,
    "table" character varying,
    name character varying,
    value text
);


--
-- Name: user_addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_addresses (
    id integer NOT NULL,
    user_id integer NOT NULL,
    label text,
    recipient_name text NOT NULL,
    phone character varying(14) NOT NULL,
    area_id integer,
    address_line text NOT NULL,
    landmark text,
    latitude numeric(9,6),
    longitude numeric(9,6),
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    district text NOT NULL,
    area_name text NOT NULL,
    zone character varying(20) DEFAULT 'inside_dhaka'::character varying NOT NULL,
    CONSTRAINT "CHK_user_addresses_zone" CHECK (((zone)::text = ANY ((ARRAY['inside_dhaka'::character varying, 'outside_dhaka'::character varying])::text[])))
);


--
-- Name: user_addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.user_addresses ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.user_addresses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: user_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_devices (
    id integer NOT NULL,
    user_id integer NOT NULL,
    platform character varying(10) NOT NULL,
    push_token text NOT NULL,
    app_version text,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_user_devices_platform" CHECK (((platform)::text = ANY ((ARRAY['android'::character varying, 'ios'::character varying, 'web'::character varying])::text[])))
);


--
-- Name: user_devices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.user_devices ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.user_devices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    phone character varying(14) NOT NULL,
    email text,
    full_name text,
    avatar_url text,
    preferred_language character(2) DEFAULT 'bn'::bpchar NOT NULL,
    phone_verified_at timestamp with time zone,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    no_show_count smallint DEFAULT '0'::smallint NOT NULL,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_users_language" CHECK ((preferred_language = ANY (ARRAY['bn'::bpchar, 'en'::bpchar]))),
    CONSTRAINT "CHK_users_status" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'suspended'::character varying, 'deleted'::character varying])::text[])))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.users ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: v_market_directory; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_market_directory AS
 SELECT s.market_id,
    f.level AS floor_level,
    f.name_en AS floor_name,
    s.walk_order,
    s.id AS shop_id,
    s.slug,
    s.name_en,
    s.name_bn,
    s.shop_number,
    s.logo_url,
    s.is_verified,
    s.rating_avg,
    s.map_x,
    s.map_y
   FROM (public.shops s
     LEFT JOIN public.market_floors f ON ((f.id = s.floor_id)))
  WHERE (((s.status)::text = 'active'::text) AND (s.deleted_at IS NULL));


--
-- Name: v_shop_balance; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_shop_balance AS
 SELECT shop_id,
    (sum(amount))::numeric(12,2) AS balance,
    max(created_at) AS last_entry_at
   FROM public.shop_ledger_entries
  GROUP BY shop_id;


--
-- Name: wishlist_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wishlist_items (
    user_id integer NOT NULL,
    product_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: order_items PK_005269d8574e6fac0493715c308; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY (id);


--
-- Name: products PK_0806c755e0aca124e67c0cf6d7d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY (id);


--
-- Name: shop_payout_accounts PK_09ed0f121c5b370b4ad02e1d016; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_payout_accounts
    ADD CONSTRAINT "PK_09ed0f121c5b370b4ad02e1d016" PRIMARY KEY (id);


--
-- Name: delivery_shop_orders PK_0c73938a51864024deb354fbeab; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_shop_orders
    ADD CONSTRAINT "PK_0c73938a51864024deb354fbeab" PRIMARY KEY (delivery_id, shop_order_id);


--
-- Name: shop_orders PK_144b24698d178764ea5bb26da3b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_orders
    ADD CONSTRAINT "PK_144b24698d178764ea5bb26da3b" PRIMARY KEY (id);


--
-- Name: messages PK_18325f38ae6de43878487eff986; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY (id);


--
-- Name: product_images PK_1974264ea7265989af8392f63a1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT "PK_1974264ea7265989af8392f63a1" PRIMARY KEY (id);


--
-- Name: payments PK_197ab7af18c93fbb0c9b28b4a59; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY (id);


--
-- Name: audit_logs PK_1bb179d048bbc581caa3b013439; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY (id);


--
-- Name: reviews PK_231ae565c273ee700b283f15c1d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY (id);


--
-- Name: categories PK_24dbc6126a28ff948da33e97d3b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY (id);


--
-- Name: product_variants PK_281e3f2c55652d6a22c0aa59fd7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT "PK_281e3f2c55652d6a22c0aa59fd7" PRIMARY KEY (id);


--
-- Name: courier_accounts PK_287734c20c62a82f7a0a3b3aeb0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courier_accounts
    ADD CONSTRAINT "PK_287734c20c62a82f7a0a3b3aeb0" PRIMARY KEY (id);


--
-- Name: search_queries PK_2945172d2d9a9f6b2339dd036e7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_queries
    ADD CONSTRAINT "PK_2945172d2d9a9f6b2339dd036e7" PRIMARY KEY (id);


--
-- Name: return_requests PK_38714de8942bd9bc3a450a06889; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_requests
    ADD CONSTRAINT "PK_38714de8942bd9bc3a450a06889" PRIMARY KEY (id);


--
-- Name: commission_rules PK_399c9fa57f7fd28dfc57acea3bd; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_rules
    ADD CONSTRAINT "PK_399c9fa57f7fd28dfc57acea3bd" PRIMARY KEY (id);


--
-- Name: price_offers PK_3aaddc6463f62236fa2cdf89f1a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_offers
    ADD CONSTRAINT "PK_3aaddc6463f62236fa2cdf89f1a" PRIMARY KEY (id);


--
-- Name: shops PK_3c6aaa6607d287de99815e60b96; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT "PK_3c6aaa6607d287de99815e60b96" PRIMARY KEY (id);


--
-- Name: shop_categories PK_4230ee63b02057d4028fcc4241a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_categories
    ADD CONSTRAINT "PK_4230ee63b02057d4028fcc4241a" PRIMARY KEY (shop_id, category_id);


--
-- Name: import_jobs PK_4d206c602f173f98e4bb85819a3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_jobs
    ADD CONSTRAINT "PK_4d206c602f173f98e4bb85819a3" PRIMARY KEY (id);


--
-- Name: coupon_redemptions PK_5086813ea980d21dbeb190ed0a7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_redemptions
    ADD CONSTRAINT "PK_5086813ea980d21dbeb190ed0a7" PRIMARY KEY (id);


--
-- Name: refunds PK_5106efb01eeda7e49a78b869738; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT "PK_5106efb01eeda7e49a78b869738" PRIMARY KEY (id);


--
-- Name: areas PK_5110493f6342f34c978c084d0d6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT "PK_5110493f6342f34c978c084d0d6" PRIMARY KEY (id);


--
-- Name: platform_settings PK_5d9031e30fac3ec3ec8b9602e17; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT "PK_5d9031e30fac3ec3ec8b9602e17" PRIMARY KEY (key);


--
-- Name: gift_card_transactions PK_6462acb8f53b9976df905077ed7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_card_transactions
    ADD CONSTRAINT "PK_6462acb8f53b9976df905077ed7" PRIMARY KEY (id);


--
-- Name: gift_cards PK_66a0b66755efd01b1749861b4aa; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_cards
    ADD CONSTRAINT "PK_66a0b66755efd01b1749861b4aa" PRIMARY KEY (id);


--
-- Name: notifications PK_6a72c3c0f683f6462415e653c3a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY (id);


--
-- Name: shipments PK_6deda4532ac542a93eab214b564; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT "PK_6deda4532ac542a93eab214b564" PRIMARY KEY (id);


--
-- Name: cart_items PK_6fccf5ec03c172d27a28a82928b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "PK_6fccf5ec03c172d27a28a82928b" PRIMARY KEY (id);


--
-- Name: orders PK_710e2d4957aa5878dfe94e4ac2f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY (id);


--
-- Name: payment_webhook_events PK_750875e71d97974be92cee813ba; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_webhook_events
    ADD CONSTRAINT "PK_750875e71d97974be92cee813ba" PRIMARY KEY (id);


--
-- Name: ad_campaigns PK_7877713eb87f782dd190eed85a7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_campaigns
    ADD CONSTRAINT "PK_7877713eb87f782dd190eed85a7" PRIMARY KEY (id);


--
-- Name: platform_staff PK_7b9efb95cf7853b29f57d22e277; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_staff
    ADD CONSTRAINT "PK_7b9efb95cf7853b29f57d22e277" PRIMARY KEY (user_id);


--
-- Name: shipment_events PK_80a42a8d00d59cbfab38e1d0872; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_events
    ADD CONSTRAINT "PK_80a42a8d00d59cbfab38e1d0872" PRIMARY KEY (id);


--
-- Name: market_members PK_8247c27cedb4ec12c2aedc4eaa3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_members
    ADD CONSTRAINT "PK_8247c27cedb4ec12c2aedc4eaa3" PRIMARY KEY (market_id, user_id);


--
-- Name: user_addresses PK_8abbeb5e3239ff7877088ffc25b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_addresses
    ADD CONSTRAINT "PK_8abbeb5e3239ff7877088ffc25b" PRIMARY KEY (id);


--
-- Name: shop_order_events PK_8b98ce175b90a63f8adcdfcd5b5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_order_events
    ADD CONSTRAINT "PK_8b98ce175b90a63f8adcdfcd5b5" PRIMARY KEY (id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: riders PK_8d3d41e9ec12eff82b325fa8c07; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.riders
    ADD CONSTRAINT "PK_8d3d41e9ec12eff82b325fa8c07" PRIMARY KEY (user_id);


--
-- Name: pickup_points PK_8fe939caf756e30da9a5b5d7317; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pickup_points
    ADD CONSTRAINT "PK_8fe939caf756e30da9a5b5d7317" PRIMARY KEY (id);


--
-- Name: support_tickets PK_942e8d8f5df86100471d2324643; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT "PK_942e8d8f5df86100471d2324643" PRIMARY KEY (id);


--
-- Name: districts PK_972a72ff4e3bea5c7f43a2b98af; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.districts
    ADD CONSTRAINT "PK_972a72ff4e3bea5c7f43a2b98af" PRIMARY KEY (id);


--
-- Name: shop_follows PK_9889180ad500c6b01e22df57125; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_follows
    ADD CONSTRAINT "PK_9889180ad500c6b01e22df57125" PRIMARY KEY (user_id, shop_id);


--
-- Name: size_charts PK_9a856588006e41aafef85dee028; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.size_charts
    ADD CONSTRAINT "PK_9a856588006e41aafef85dee028" PRIMARY KEY (id);


--
-- Name: subscription_plans PK_9ab8fe6918451ab3d0a4fb6bb0c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT "PK_9ab8fe6918451ab3d0a4fb6bb0c" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: deliveries PK_a6ef225c5c5f0974e503bfb731f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT "PK_a6ef225c5c5f0974e503bfb731f" PRIMARY KEY (id);


--
-- Name: sub_areas PK_acf3fea896b6df1bd20dd5ff732; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_areas
    ADD CONSTRAINT "PK_acf3fea896b6df1bd20dd5ff732" PRIMARY KEY (id);


--
-- Name: brands PK_b0c437120b624da1034a81fc561; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT "PK_b0c437120b624da1034a81fc561" PRIMARY KEY (id);


--
-- Name: carts PK_b5f695a59f5ebb50af3c8160816; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT "PK_b5f695a59f5ebb50af3c8160816" PRIMARY KEY (id);


--
-- Name: shop_payouts PK_b8e600369f8de645b3f7ad84406; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_payouts
    ADD CONSTRAINT "PK_b8e600369f8de645b3f7ad84406" PRIMARY KEY (id);


--
-- Name: divisions PK_c1f864477b3fd0954564108ed96; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.divisions
    ADD CONSTRAINT "PK_c1f864477b3fd0954564108ed96" PRIMARY KEY (id);


--
-- Name: user_devices PK_c9e7e648903a9e537347aba4371; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT "PK_c9e7e648903a9e537347aba4371" PRIMARY KEY (id);


--
-- Name: shop_ledger_entries PK_ccad2f0781a04199c07747c5e0c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_ledger_entries
    ADD CONSTRAINT "PK_ccad2f0781a04199c07747c5e0c" PRIMARY KEY (id);


--
-- Name: support_ticket_notes PK_ce42d5ec9d5731befe4fdd7c190; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_ticket_notes
    ADD CONSTRAINT "PK_ce42d5ec9d5731befe4fdd7c190" PRIMARY KEY (id);


--
-- Name: inventory_movements PK_d7597827c1dcffae889db3ab873; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT "PK_d7597827c1dcffae889db3ab873" PRIMARY KEY (id);


--
-- Name: coupons PK_d7ea8864a0150183770f3e9a8cb; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT "PK_d7ea8864a0150183770f3e9a8cb" PRIMARY KEY (id);


--
-- Name: shop_hours PK_d89c6e31f810fcfa401621ba8e0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_hours
    ADD CONSTRAINT "PK_d89c6e31f810fcfa401621ba8e0" PRIMARY KEY (shop_id, weekday);


--
-- Name: shop_subscriptions PK_d8ad5edcf86a22b82e678747220; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_subscriptions
    ADD CONSTRAINT "PK_d8ad5edcf86a22b82e678747220" PRIMARY KEY (id);


--
-- Name: markets PK_dda44129b32f21ae9f1c28dcf99; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT "PK_dda44129b32f21ae9f1c28dcf99" PRIMARY KEY (id);


--
-- Name: wishlist_items PK_e0584a3664156caa678765afadc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT "PK_e0584a3664156caa678765afadc" PRIMARY KEY (user_id, product_id);


--
-- Name: shop_members PK_e2b6cc91da6b996f4bd5d3d5601; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_members
    ADD CONSTRAINT "PK_e2b6cc91da6b996f4bd5d3d5601" PRIMARY KEY (shop_id, user_id);


--
-- Name: conversations PK_ee34f4f7ced4ec8681f26bf04ef; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY (id);


--
-- Name: market_floors PK_fa64950298a17a831da4b374966; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_floors
    ADD CONSTRAINT "PK_fa64950298a17a831da4b374966" PRIMARY KEY (id);


--
-- Name: return_items PK_fb52146d267390869cfccf00809; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT "PK_fb52146d267390869cfccf00809" PRIMARY KEY (return_request_id, order_item_id);


--
-- Name: shop_verifications PK_ff5175ba02615379f9c56f1fa49; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_verifications
    ADD CONSTRAINT "PK_ff5175ba02615379f9c56f1fa49" PRIMARY KEY (id);


--
-- Name: orders UQ_035026a83bef9740d7ad05df383; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "UQ_035026a83bef9740d7ad05df383" UNIQUE (order_no);


--
-- Name: gift_cards UQ_08ff997110a4e3842076964f0ed; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_cards
    ADD CONSTRAINT "UQ_08ff997110a4e3842076964f0ed" UNIQUE (code);


--
-- Name: sub_areas UQ_12a493888226fce012d349568b4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_areas
    ADD CONSTRAINT "UQ_12a493888226fce012d349568b4" UNIQUE (area_id, name_en);


--
-- Name: shipments UQ_1bc7567c4db8243316fc9ba7faa; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT "UQ_1bc7567c4db8243316fc9ba7faa" UNIQUE (shop_order_id);


--
-- Name: subscription_plans UQ_2d2df70a81d37c893ef216caf8a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT "UQ_2d2df70a81d37c893ef216caf8a" UNIQUE (code);


--
-- Name: carts UQ_2ec1c94a977b940d85a4f498aea; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT "UQ_2ec1c94a977b940d85a4f498aea" UNIQUE (user_id);


--
-- Name: areas UQ_40378560986690c91e4aacbd545; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT "UQ_40378560986690c91e4aacbd545" UNIQUE (district_id, name_en);


--
-- Name: categories UQ_420d9f679d41281f282f5bc7d09; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09" UNIQUE (slug);


--
-- Name: conversations UQ_54a9a62dc30a0df423593afd8c1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT "UQ_54a9a62dc30a0df423593afd8c1" UNIQUE (customer_id, shop_id);


--
-- Name: shop_orders UQ_566c7abbcc0f8f8d1a803c9b125; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_orders
    ADD CONSTRAINT "UQ_566c7abbcc0f8f8d1a803c9b125" UNIQUE (order_id, shop_id);


--
-- Name: districts UQ_6da39a4199296a9dba4c3df1f49; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.districts
    ADD CONSTRAINT "UQ_6da39a4199296a9dba4c3df1f49" UNIQUE (division_id, name_en);


--
-- Name: shops UQ_8c28ec876676eeb1dcb65c01b7f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT "UQ_8c28ec876676eeb1dcb65c01b7f" UNIQUE (slug);


--
-- Name: shop_orders UQ_9c1cfaf690e10c0712fa9fe3b38; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_orders
    ADD CONSTRAINT "UQ_9c1cfaf690e10c0712fa9fe3b38" UNIQUE (sub_order_no);


--
-- Name: users UQ_a000cca60bcf04454e727699490; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE (phone);


--
-- Name: coupon_redemptions UQ_adb70aa4959d5b2676fa4fde836; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_redemptions
    ADD CONSTRAINT "UQ_adb70aa4959d5b2676fa4fde836" UNIQUE (order_id);


--
-- Name: brands UQ_b15428f362be2200922952dc268; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT "UQ_b15428f362be2200922952dc268" UNIQUE (slug);


--
-- Name: payments UQ_b7e96f687c7b9129039cc82d0e6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "UQ_b7e96f687c7b9129039cc82d0e6" UNIQUE (gateway, gateway_trx_id);


--
-- Name: market_floors UQ_b9765b9018a5f74734e75af4536; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_floors
    ADD CONSTRAINT "UQ_b9765b9018a5f74734e75af4536" UNIQUE (market_id, level);


--
-- Name: carts UQ_be65dcd886ccd9393bda1e18230; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT "UQ_be65dcd886ccd9393bda1e18230" UNIQUE (guest_token);


--
-- Name: user_devices UQ_c74f9dcb05772e4b9dea80d3a41; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT "UQ_c74f9dcb05772e4b9dea80d3a41" UNIQUE (push_token);


--
-- Name: cart_items UQ_d1a62275445322e93824d33dbfe; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "UQ_d1a62275445322e93824d33dbfe" UNIQUE (cart_id, variant_id);


--
-- Name: coupons UQ_e025109230e82925843f2a14c48; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT "UQ_e025109230e82925843f2a14c48" UNIQUE (code);


--
-- Name: products UQ_e7cff1073f7716f8cbc61004bd0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "UQ_e7cff1073f7716f8cbc61004bd0" UNIQUE (shop_id, slug);


--
-- Name: payment_webhook_events UQ_f3ab3e1dcfb30f1a4f3e5680b81; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_webhook_events
    ADD CONSTRAINT "UQ_f3ab3e1dcfb30f1a4f3e5680b81" UNIQUE (gateway, event_id);


--
-- Name: support_tickets UQ_fcb4080d9d57424031c4880cb21; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT "UQ_fcb4080d9d57424031c4880cb21" UNIQUE (ticket_no);


--
-- Name: markets UQ_fd5c6ef3d47e6df1d2e355c302c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT "UQ_fd5c6ef3d47e6df1d2e355c302c" UNIQUE (slug);


--
-- Name: divisions UQ_fd6332a532030d4b4ce535d1b50; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.divisions
    ADD CONSTRAINT "UQ_fd6332a532030d4b4ce535d1b50" UNIQUE (name_en);


--
-- Name: IDX_06aa31c15a76f1463637b07420; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_06aa31c15a76f1463637b07420" ON public.gift_card_transactions USING btree (gift_card_id);


--
-- Name: IDX_0a3c7a707500291fedca9b8f34; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_0a3c7a707500291fedca9b8f34" ON public.pickup_points USING btree (market_id);


--
-- Name: IDX_0a3ef3a3d31b8658fc1c895b17; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_0a3ef3a3d31b8658fc1c895b17" ON public.commission_rules USING btree (category_id, valid_from);


--
-- Name: IDX_11d8635c21eeba3de3e8769424; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_11d8635c21eeba3de3e8769424" ON public.support_tickets USING btree (status, priority);


--
-- Name: IDX_11fefa35e3ef25881234b8b89a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_11fefa35e3ef25881234b8b89a" ON public.orders USING btree (customer_id, created_at);


--
-- Name: IDX_28bd79e1b3f7c1168f0904ce24; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_28bd79e1b3f7c1168f0904ce24" ON public.user_devices USING btree (user_id);


--
-- Name: IDX_2a761d0390e33990ab5862bbbe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_2a761d0390e33990ab5862bbbe" ON public.deliveries USING btree (rider_id, status);


--
-- Name: IDX_2c0d65f24ec5d3c9a54f99e152; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_2c0d65f24ec5d3c9a54f99e152" ON public.shops USING btree (primary_category_id);


--
-- Name: IDX_310667f935698fcd8cb319113a; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_310667f935698fcd8cb319113a" ON public.notifications USING btree (user_id, created_at);


--
-- Name: IDX_389ead41c18f28080df485f3fc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_389ead41c18f28080df485f3fc" ON public.price_offers USING btree (shop_id, status);


--
-- Name: IDX_38e2f32be31de92b8cec259304; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_38e2f32be31de92b8cec259304" ON public.inventory_movements USING btree (variant_id, created_at);


--
-- Name: IDX_4212d63aba732f01c6c995becf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4212d63aba732f01c6c995becf" ON public.shop_ledger_entries USING btree (shop_id, created_at);


--
-- Name: IDX_4981129d48833f45cc3e70f06b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4981129d48833f45cc3e70f06b" ON public.search_queries USING btree (created_at);


--
-- Name: IDX_4e7e9456e13d26f5a005bdc383; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4e7e9456e13d26f5a005bdc383" ON public.import_jobs USING btree (shop_id, created_at);


--
-- Name: IDX_59b38438ffca2178e770920167; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_59b38438ffca2178e770920167" ON public.reviews USING btree (shop_id, created_at);


--
-- Name: IDX_6343513e20e2deab45edfce131; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_6343513e20e2deab45edfce131" ON public.product_variants USING btree (product_id);


--
-- Name: IDX_654faec719fb531dac16c62b4d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_654faec719fb531dac16c62b4d" ON public.courier_accounts USING btree (shop_id);


--
-- Name: IDX_682c3bb53ffb9f45ddf5d959ba; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_682c3bb53ffb9f45ddf5d959ba" ON public.price_offers USING btree (customer_id, status);


--
-- Name: IDX_6a19baf6dd62cac42fbb40a518; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_6a19baf6dd62cac42fbb40a518" ON public.shipments USING btree (status);


--
-- Name: IDX_7421efc125d95e413657efa3c6; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_7421efc125d95e413657efa3c6" ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: IDX_7a5100ce0548ef27a6f1533a5c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_7a5100ce0548ef27a6f1533a5c" ON public.user_addresses USING btree (user_id);


--
-- Name: IDX_7d5349c9553f4b30ad8aef0b37; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_7d5349c9553f4b30ad8aef0b37" ON public.product_images USING btree (product_id, sort_order);


--
-- Name: IDX_7f48aa5d56c42aeb495db01668; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_7f48aa5d56c42aeb495db01668" ON public.refunds USING btree (payment_id);


--
-- Name: IDX_80d9c5ca8bc7d969381f588d96; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_80d9c5ca8bc7d969381f588d96" ON public.markets USING btree (sub_area_id);


--
-- Name: IDX_8584a1974e1ca95f4861d975ff; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_8584a1974e1ca95f4861d975ff" ON public.messages USING btree (conversation_id, created_at);


--
-- Name: IDX_88cea2dc9c31951d06437879b4; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_88cea2dc9c31951d06437879b4" ON public.categories USING btree (parent_id);


--
-- Name: IDX_9482e9567d8dcc2bc615981ef4; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9482e9567d8dcc2bc615981ef4" ON public.reviews USING btree (product_id);


--
-- Name: IDX_988477d139271e5f88e32eb224; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_988477d139271e5f88e32eb224" ON public.shop_payouts USING btree (shop_id, created_at);


--
-- Name: IDX_a651bd564c34e63abbcf110129; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a651bd564c34e63abbcf110129" ON public.shop_verifications USING btree (shop_id, kind);


--
-- Name: IDX_a9e218003af0837206a392118e; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_a9e218003af0837206a392118e" ON public.shipments USING btree (provider, consignment_id);


--
-- Name: IDX_b2f7b823a21562eeca20e72b00; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b2f7b823a21562eeca20e72b00" ON public.payments USING btree (order_id);


--
-- Name: IDX_bf62e73eecc6aef7c7f63885df; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_bf62e73eecc6aef7c7f63885df" ON public.shipment_events USING btree (shipment_id, created_at);


--
-- Name: IDX_cc9358bf81fd343b8fa699787b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_cc9358bf81fd343b8fa699787b" ON public.ad_campaigns USING btree (placement, starts_at, ends_at);


--
-- Name: IDX_cd14e743131cc940bce9124fa7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_cd14e743131cc940bce9124fa7" ON public.conversations USING btree (shop_id, last_message_at);


--
-- Name: IDX_ce507559d955e3fdb64a4b6ccb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ce507559d955e3fdb64a4b6ccb" ON public.order_items USING btree (shop_order_id);


--
-- Name: IDX_ce997a05626cd5a5861ca288dd; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ce997a05626cd5a5861ca288dd" ON public.support_ticket_notes USING btree (ticket_id);


--
-- Name: IDX_d264561c1d0860970b7ca2658f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d264561c1d0860970b7ca2658f" ON public.markets USING btree (area_id);


--
-- Name: IDX_daf3c24d1f5abf726abbea0677; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_daf3c24d1f5abf726abbea0677" ON public.market_members USING btree (user_id);


--
-- Name: IDX_db2d0ea722e16e0fe8ab3bce11; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_db2d0ea722e16e0fe8ab3bce11" ON public.order_items USING btree (variant_id);


--
-- Name: IDX_dd4cda7c82246e92c50453fda3; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_dd4cda7c82246e92c50453fda3" ON public.coupon_redemptions USING btree (coupon_id, user_id);


--
-- Name: IDX_de1ce7c6c89898be769ff553b0; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_de1ce7c6c89898be769ff553b0" ON public.shipments USING btree (shop_id);


--
-- Name: IDX_dfd059abfd04acb470d27822d4; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_dfd059abfd04acb470d27822d4" ON public.shop_order_events USING btree (shop_order_id, created_at);


--
-- Name: IDX_e432a7251bc55359ce655fcc92; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_e432a7251bc55359ce655fcc92" ON public.return_requests USING btree (shop_order_id);


--
-- Name: IDX_ede780fc2b865d1d1323e59803; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ede780fc2b865d1d1323e59803" ON public.cart_items USING btree (variant_id);


--
-- Name: IDX_ee4fccaada563c04413b8916d0; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ee4fccaada563c04413b8916d0" ON public.shop_categories USING btree (category_id);


--
-- Name: IDX_f0147e76ed9a1c177f667304df; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_f0147e76ed9a1c177f667304df" ON public.shop_members USING btree (user_id);


--
-- Name: IDX_markets_name_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_markets_name_trgm" ON public.markets USING gin ((((name_en || ' '::text) || name_bn)) public.gin_trgm_ops);


--
-- Name: IDX_product_variants_attributes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_product_variants_attributes" ON public.product_variants USING gin (attributes);


--
-- Name: IDX_products_category_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_products_category_status" ON public.products USING btree (category_id, status);


--
-- Name: IDX_products_name_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_products_name_trgm" ON public.products USING gin ((((name_en || ' '::text) || COALESCE(name_bn, ''::text))) public.gin_trgm_ops);


--
-- Name: IDX_products_search_vector; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_products_search_vector" ON public.products USING gin (search_vector);


--
-- Name: IDX_products_shop_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_products_shop_status" ON public.products USING btree (shop_id, status);


--
-- Name: IDX_shop_orders_reserved_until; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_shop_orders_reserved_until" ON public.shop_orders USING btree (reserved_until) WHERE ((status)::text = ANY ((ARRAY['placed'::character varying, 'confirmed'::character varying, 'ready_for_pickup'::character varying])::text[]));


--
-- Name: IDX_shop_orders_shop_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_shop_orders_shop_status" ON public.shop_orders USING btree (shop_id, status, created_at);


--
-- Name: IDX_shops_name_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_shops_name_trgm" ON public.shops USING gin ((((name_en || ' '::text) || COALESCE(name_bn, ''::text))) public.gin_trgm_ops);


--
-- Name: IDX_shops_walk; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_shops_walk" ON public.shops USING btree (market_id, floor_id, walk_order);


--
-- Name: UQ_courier_accounts_one_default; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_courier_accounts_one_default" ON public.courier_accounts USING btree (shop_id, provider) WHERE is_default;


--
-- Name: UQ_reviews_one_per_target; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_reviews_one_per_target" ON public.reviews USING btree (shop_order_id, COALESCE(product_id, 0));


--
-- Name: UQ_shop_payout_accounts_one_default; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_shop_payout_accounts_one_default" ON public.shop_payout_accounts USING btree (shop_id) WHERE is_default;


--
-- Name: UQ_shop_subscriptions_one_current; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_shop_subscriptions_one_current" ON public.shop_subscriptions USING btree (shop_id) WHERE ((status)::text = ANY ((ARRAY['trial'::character varying, 'active'::character varying, 'past_due'::character varying])::text[]));


--
-- Name: UQ_shops_market_number; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_shops_market_number" ON public.shops USING btree (market_id, shop_number) WHERE ((shop_number IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: UQ_user_addresses_one_default; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_user_addresses_one_default" ON public.user_addresses USING btree (user_id) WHERE is_default;


--
-- Name: UQ_users_email_lower; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_users_email_lower" ON public.users USING btree (lower(email)) WHERE (email IS NOT NULL);


--
-- Name: shop_ledger_entries FK_0077ff1a0146af056577e80e5c9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_ledger_entries
    ADD CONSTRAINT "FK_0077ff1a0146af056577e80e5c9" FOREIGN KEY (shop_id) REFERENCES public.shops(id);


--
-- Name: areas FK_0133ab4e71f1069d0db0655f2e5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT "FK_0133ab4e71f1069d0db0655f2e5" FOREIGN KEY (district_id) REFERENCES public.districts(id);


--
-- Name: gift_card_transactions FK_06aa31c15a76f1463637b07420f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_card_transactions
    ADD CONSTRAINT "FK_06aa31c15a76f1463637b07420f" FOREIGN KEY (gift_card_id) REFERENCES public.gift_cards(id);


--
-- Name: pickup_points FK_0a3c7a707500291fedca9b8f343; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pickup_points
    ADD CONSTRAINT "FK_0a3c7a707500291fedca9b8f343" FOREIGN KEY (market_id) REFERENCES public.markets(id);


--
-- Name: support_tickets FK_0b1eb4f1f984aab3c481c48468a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT "FK_0b1eb4f1f984aab3c481c48468a" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: shipments FK_111f29a3517f16391665bf47ac0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT "FK_111f29a3517f16391665bf47ac0" FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: reviews FK_116b47417d5344f6a10cc8370e7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "FK_116b47417d5344f6a10cc8370e7" FOREIGN KEY (shop_order_id) REFERENCES public.shop_orders(id);


--
-- Name: support_tickets FK_1497d97a1193ff937dea51ac1ea; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT "FK_1497d97a1193ff937dea51ac1ea" FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: products FK_1530a6f15d3c79d1b70be98f2be; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_1530a6f15d3c79d1b70be98f2be" FOREIGN KEY (brand_id) REFERENCES public.brands(id);


--
-- Name: ad_campaigns FK_175fdd2082d25bb70818ef1fbee; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_campaigns
    ADD CONSTRAINT "FK_175fdd2082d25bb70818ef1fbee" FOREIGN KEY (shop_id) REFERENCES public.shops(id);


--
-- Name: audit_logs FK_177183f29f438c488b5e8510cdb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "FK_177183f29f438c488b5e8510cdb" FOREIGN KEY (actor_id) REFERENCES public.users(id);


--
-- Name: wishlist_items FK_177397e044732e7e9c0215cd5b7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT "FK_177397e044732e7e9c0215cd5b7" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: inventory_movements FK_1bb851d7c7ef2435fad91cae453; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT "FK_1bb851d7c7ef2435fad91cae453" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);


--
-- Name: shipments FK_1bc7567c4db8243316fc9ba7faa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT "FK_1bc7567c4db8243316fc9ba7faa" FOREIGN KEY (shop_order_id) REFERENCES public.shop_orders(id) ON DELETE CASCADE;


--
-- Name: sub_areas FK_1f492fee4187f745f580323c62a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_areas
    ADD CONSTRAINT "FK_1f492fee4187f745f580323c62a" FOREIGN KEY (area_id) REFERENCES public.areas(id);


--
-- Name: messages FK_22133395bd13b970ccd0c34ab22; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: conversations FK_22fbbb93632ee571505fd76a6bd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT "FK_22fbbb93632ee571505fd76a6bd" FOREIGN KEY (shop_id) REFERENCES public.shops(id);


--
-- Name: gift_cards FK_249a496fb5f09086203b0abe882; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_cards
    ADD CONSTRAINT "FK_249a496fb5f09086203b0abe882" FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: shop_categories FK_2538b463070f40928e80f0d028c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_categories
    ADD CONSTRAINT "FK_2538b463070f40928e80f0d028c" FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;


--
-- Name: shop_subscriptions FK_26c1b95707628016043f1bb0882; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_subscriptions
    ADD CONSTRAINT "FK_26c1b95707628016043f1bb0882" FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: shop_payouts FK_27f3a9c8d67afd64f55c17fe2a8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_payouts
    ADD CONSTRAINT "FK_27f3a9c8d67afd64f55c17fe2a8" FOREIGN KEY (shop_id) REFERENCES public.shops(id);


--
-- Name: user_devices FK_28bd79e1b3f7c1168f0904ce241; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT "FK_28bd79e1b3f7c1168f0904ce241" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: coupons FK_2a066f63c9dc8cf6094017b6938; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT "FK_2a066f63c9dc8cf6094017b6938" FOREIGN KEY (shop_id) REFERENCES public.shops(id);


--
-- Name: shops FK_2c0d65f24ec5d3c9a54f99e1529; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT "FK_2c0d65f24ec5d3c9a54f99e1529" FOREIGN KEY (primary_category_id) REFERENCES public.categories(id);


--
-- Name: carts FK_2ec1c94a977b940d85a4f498aea; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT "FK_2ec1c94a977b940d85a4f498aea" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: support_ticket_notes FK_31f50e4aadf281b5d2ecb46e79e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_ticket_notes
    ADD CONSTRAINT "FK_31f50e4aadf281b5d2ecb46e79e" FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: ad_campaigns FK_321b0e8815d2cf6fad5990fd39e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_campaigns
    ADD CONSTRAINT "FK_321b0e8815d2cf6fad5990fd39e" FOREIGN KEY (market_id) REFERENCES public.markets(id);


--
-- Name: price_offers FK_326165f31a5197bb0d8f3d34b41; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_offers
    ADD CONSTRAINT "FK_326165f31a5197bb0d8f3d34b41" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id);


--
-- Name: shops FK_342c0e88448b150aade000d453e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT "FK_342c0e88448b150aade000d453e" FOREIGN KEY (floor_id) REFERENCES public.market_floors(id);


--
-- Name: price_offers FK_36609f33f77e0540338c8d9445b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_offers
    ADD CONSTRAINT "FK_36609f33f77e0540338c8d9445b" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);


--
-- Name: messages FK_3bc55a7c3f9ed54b520bb5cfe23; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: user_addresses FK_3c9b4d155e1f5cc98d6b7063050; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_addresses
    ADD CONSTRAINT "FK_3c9b4d155e1f5cc98d6b7063050" FOREIGN KEY (area_id) REFERENCES public.areas(id);


--
-- Name: order_items FK_4094d4ef12f2b0d8f24e65a9ca7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "FK_4094d4ef12f2b0d8f24e65a9ca7" FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: riders FK_4098ce731448bcaac94b1c9b025; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.riders
    ADD CONSTRAINT "FK_4098ce731448bcaac94b1c9b025" FOREIGN KEY (home_hub_id) REFERENCES public.pickup_points(id);


--
-- Name: shop_payouts FK_432fb5d06b726f8ce4e6b8fd37b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_payouts
    ADD CONSTRAINT "FK_432fb5d06b726f8ce4e6b8fd37b" FOREIGN KEY (payout_account_id) REFERENCES public.shop_payout_accounts(id);


--
-- Name: delivery_shop_orders FK_45070a932a5aa693b110fe2bcc1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_shop_orders
    ADD CONSTRAINT "FK_45070a932a5aa693b110fe2bcc1" FOREIGN KEY (delivery_id) REFERENCES public.deliveries(id) ON DELETE CASCADE;


--
-- Name: market_members FK_45911c0296b23bb57bb2595db77; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_members
    ADD CONSTRAINT "FK_45911c0296b23bb57bb2595db77" FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: inventory_movements FK_4a137ccc372acb73821c4dd3991; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT "FK_4a137ccc372acb73821c4dd3991" FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: shops FK_4bb54d4b454fbfc410e2917691a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT "FK_4bb54d4b454fbfc410e2917691a" FOREIGN KEY (area_id) REFERENCES public.areas(id);


--
-- Name: support_tickets FK_4c3a306f404bff5817f37d46616; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT "FK_4c3a306f404bff5817f37d46616" FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: product_images FK_4f166bb8c2bfcef2498d97b4068; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: shop_orders FK_4f82b4416535d33ed5d93b48a31; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_orders
    ADD CONSTRAINT "FK_4f82b4416535d33ed5d93b48a31" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: cart_items FK_53d597384719e04ff18d02f5a9f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "FK_53d597384719e04ff18d02f5a9f" FOREIGN KEY (offer_id) REFERENCES public.price_offers(id) ON DELETE SET NULL;


--
-- Name: wishlist_items FK_549f44d8b756e2690deb099f83b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wishlist_items
    ADD CONSTRAINT "FK_549f44d8b756e2690deb099f83b" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: commission_rules FK_56cf79cbb1e77621ed7b5591d5d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_rules
    ADD CONSTRAINT "FK_56cf79cbb1e77621ed7b5591d5d" FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: shipments FK_59cff4c973cb4482206301e6769; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT "FK_59cff4c973cb4482206301e6769" FOREIGN KEY (courier_account_id) REFERENCES public.courier_accounts(id);


--
-- Name: orders FK_6284f0f60e4cb96c12ff96f0f15; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "FK_6284f0f60e4cb96c12ff96f0f15" FOREIGN KEY (coupon_id) REFERENCES public.coupons(id);


--
-- Name: product_variants FK_6343513e20e2deab45edfce1316; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT "FK_6343513e20e2deab45edfce1316" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: cart_items FK_6385a745d9e12a89b859bb25623; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "FK_6385a745d9e12a89b859bb25623" FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE;


--
-- Name: size_charts FK_63e876d56be41cdcc6c0bf4fd5c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.size_charts
    ADD CONSTRAINT "FK_63e876d56be41cdcc6c0bf4fd5c" FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: courier_accounts FK_654faec719fb531dac16c62b4df; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courier_accounts
    ADD CONSTRAINT "FK_654faec719fb531dac16c62b4df" FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;


--
-- Name: payments FK_67bce91ea45003743852c335867; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "FK_67bce91ea45003743852c335867" FOREIGN KEY (shop_order_id) REFERENCES public.shop_orders(id);


--
-- Name: shop_order_events FK_68dc0631f465594a95a613771d2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_order_events
    ADD CONSTRAINT "FK_68dc0631f465594a95a613771d2" FOREIGN KEY (actor_id) REFERENCES public.users(id);


--
-- Name: price_offers FK_69fb52f856f07fc7305ccee01ad; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_offers
    ADD CONSTRAINT "FK_69fb52f856f07fc7305ccee01ad" FOREIGN KEY (customer_id) REFERENCES public.users(id);


--
-- Name: support_tickets FK_6d258c19816e99102e2aabcd7be; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT "FK_6d258c19816e99102e2aabcd7be" FOREIGN KEY (shop_id) REFERENCES public.shops(id);


--
-- Name: shop_follows FK_6e86e74bd2eb0cb9d4f37f71e1b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_follows
    ADD CONSTRAINT "FK_6e86e74bd2eb0cb9d4f37f71e1b" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: shop_members FK_721a7b3720a5e1e3a0fabc914d6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_members
    ADD CONSTRAINT "FK_721a7b3720a5e1e3a0fabc914d6" FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;


--
-- Name: reviews FK_728447781a30bc3fcfe5c2f1cdf; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: commission_rules FK_72b4de86b0f88b9a00a7d99a42b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_rules
    ADD CONSTRAINT "FK_72b4de86b0f88b9a00a7d99a42b" FOREIGN KEY (shop_id) REFERENCES public.shops(id);


--
-- Name: markets FK_73ad85f11339e35001e60a44fc7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT "FK_73ad85f11339e35001e60a44fc7" FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: shop_ledger_entries FK_74c4a0b321c8949039652eff4b5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_ledger_entries
    ADD CONSTRAINT "FK_74c4a0b321c8949039652eff4b5" FOREIGN KEY (payout_id) REFERENCES public.shop_payouts(id);


--
-- Name: shipment_events FK_7550a4aa8c7fe2d64f6c71d7da1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_events
    ADD CONSTRAINT "FK_7550a4aa8c7fe2d64f6c71d7da1" FOREIGN KEY (shipment_id) REFERENCES public.shipments(id) ON DELETE CASCADE;


--
-- Name: shop_ledger_entries FK_75d3cec834a91946e5e1d8bc6bc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_ledger_entries
    ADD CONSTRAINT "FK_75d3cec834a91946e5e1d8bc6bc" FOREIGN KEY (shop_order_id) REFERENCES public.shop_orders(id);


--
-- Name: product_images FK_7645bd68229997627f7b2191687; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT "FK_7645bd68229997627f7b2191687" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE;


--
-- Name: shop_ledger_entries FK_766555c747039ff8fe1715928dd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_ledger_entries
    ADD CONSTRAINT "FK_766555c747039ff8fe1715928dd" FOREIGN KEY (refund_id) REFERENCES public.refunds(id);


--
-- Name: orders FK_772d0ce0473ac2ccfa26060dbe9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "FK_772d0ce0473ac2ccfa26060dbe9" FOREIGN KEY (customer_id) REFERENCES public.users(id);


--
-- Name: shop_hours FK_776e3aa2451c33f8f6632d09732; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_hours
    ADD CONSTRAINT "FK_776e3aa2451c33f8f6632d09732" FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;


--
-- Name: messages FK_785fecd3c7dbf760fbabeb6a959; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "FK_785fecd3c7dbf760fbabeb6a959" FOREIGN KEY (offer_id) REFERENCES public.price_offers(id);


--
-- Name: deliveries FK_789dba7900f6d25550280ad3b93; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT "FK_789dba7900f6d25550280ad3b93" FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: user_addresses FK_7a5100ce0548ef27a6f1533a5ce; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_addresses
    ADD CONSTRAINT "FK_7a5100ce0548ef27a6f1533a5ce" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: platform_staff FK_7b9efb95cf7853b29f57d22e277; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_staff
    ADD CONSTRAINT "FK_7b9efb95cf7853b29f57d22e277" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: refunds FK_7f48aa5d56c42aeb495db016683; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT "FK_7f48aa5d56c42aeb495db016683" FOREIGN KEY (payment_id) REFERENCES public.payments(id);


--
-- Name: order_items FK_7fb93ff11c54ec4bb71c78c2fe5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "FK_7fb93ff11c54ec4bb71c78c2fe5" FOREIGN KEY (offer_id) REFERENCES public.price_offers(id);


--
-- Name: markets FK_80d9c5ca8bc7d969381f588d960; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT "FK_80d9c5ca8bc7d969381f588d960" FOREIGN KEY (sub_area_id) REFERENCES public.sub_areas(id);


--
-- Name: categories FK_88cea2dc9c31951d06437879b40; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "FK_88cea2dc9c31951d06437879b40" FOREIGN KEY (parent_id) REFERENCES public.categories(id);


--
-- Name: riders FK_8d3d41e9ec12eff82b325fa8c07; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.riders
    ADD CONSTRAINT "FK_8d3d41e9ec12eff82b325fa8c07" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: coupons FK_93bf51b012602022d0002d2162b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT "FK_93bf51b012602022d0002d2162b" FOREIGN KEY (market_id) REFERENCES public.markets(id);


--
-- Name: reviews FK_9482e9567d8dcc2bc615981ef44; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "FK_9482e9567d8dcc2bc615981ef44" FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: coupon_redemptions FK_986f8dd830915cf2835f89709df; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_redemptions
    ADD CONSTRAINT "FK_986f8dd830915cf2835f89709df" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: products FK_9a5f6868c96e0069e699f33e124; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: notifications FK_9a8a82462cab47c73d25f49261f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: import_jobs FK_9b01cc9315b174e9fd028b8da5d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_jobs
    ADD CONSTRAINT "FK_9b01cc9315b174e9fd028b8da5d" FOREIGN KEY (shop_id) REFERENCES public.shops(id);


--
-- Name: coupon_redemptions FK_9df1b9bc48e3eea5da3762f8e56; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_redemptions
    ADD CONSTRAINT "FK_9df1b9bc48e3eea5da3762f8e56" FOREIGN KEY (coupon_id) REFERENCES public.coupons(id);


--
-- Name: products FK_9e952e93f369f16e27dd786c33f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_9e952e93f369f16e27dd786c33f" FOREIGN KEY (shop_id) REFERENCES public.shops(id);


--
-- Name: shop_follows FK_a14449637075fecc1aa160d7264; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_follows
    ADD CONSTRAINT "FK_a14449637075fecc1aa160d7264" FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;


--
-- Name: products FK_a2916070ca16e6ec248258c33c9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_a2916070ca16e6ec248258c33c9" FOREIGN KEY (size_chart_id) REFERENCES public.size_charts(id);


--
-- Name: size_charts FK_a368b6ab812d967cf3dbf1ab870; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.size_charts
    ADD CONSTRAINT "FK_a368b6ab812d967cf3dbf1ab870" FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;


--
-- Name: refunds FK_a46ac94548ec7f359e31c90da88; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT "FK_a46ac94548ec7f359e31c90da88" FOREIGN KEY (return_request_id) REFERENCES public.return_requests(id);


--
-- Name: refunds FK_a516ad09a9717bf89f42a5b0e95; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT "FK_a516ad09a9717bf89f42a5b0e95" FOREIGN KEY (shop_order_id) REFERENCES public.shop_orders(id);


--
-- Name: messages FK_a6af79f5f202f7e228839b71c8c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT "FK_a6af79f5f202f7e228839b71c8c" FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: price_offers FK_a7a298f6bde213a5db57893da35; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_offers
    ADD CONSTRAINT "FK_a7a298f6bde213a5db57893da35" FOREIGN KEY (shop_id) REFERENCES public.shops(id);


--
-- Name: cart_items FK_ad4336ea52ca96a9094a76cd9f3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "FK_ad4336ea52ca96a9094a76cd9f3" FOREIGN KEY (shop_id) REFERENCES public.shops(id);


--
-- Name: coupon_redemptions FK_adb70aa4959d5b2676fa4fde836; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_redemptions
    ADD CONSTRAINT "FK_adb70aa4959d5b2676fa4fde836" FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: shops FK_af2e847d1cc4112327381d5bc7e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT "FK_af2e847d1cc4112327381d5bc7e" FOREIGN KEY (onboarded_by) REFERENCES public.users(id);


--
-- Name: districts FK_b0f53665358e2fee2fd290d115f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.districts
    ADD CONSTRAINT "FK_b0f53665358e2fee2fd290d115f" FOREIGN KEY (division_id) REFERENCES public.divisions(id);


--
-- Name: payments FK_b2f7b823a21562eeca20e72b006; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "FK_b2f7b823a21562eeca20e72b006" FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: reviews FK_b8002ad83c018f58beac46dee3f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "FK_b8002ad83c018f58beac46dee3f" FOREIGN KEY (shop_id) REFERENCES public.shops(id);


--
-- Name: search_queries FK_be640c6890ac457098628795eaa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_queries
    ADD CONSTRAINT "FK_be640c6890ac457098628795eaa" FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE SET NULL;


--
-- Name: deliveries FK_bfa72a4a1d9342407a88d2467b3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT "FK_bfa72a4a1d9342407a88d2467b3" FOREIGN KEY (hub_id) REFERENCES public.pickup_points(id);


--
-- Name: products FK_c1af9b47239151e255f62e03247; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_c1af9b47239151e255f62e03247" FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: shop_order_events FK_c2fbb6cd945aebdd9565e9c9afd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_order_events
    ADD CONSTRAINT "FK_c2fbb6cd945aebdd9565e9c9afd" FOREIGN KEY (shop_order_id) REFERENCES public.shop_orders(id) ON DELETE CASCADE;


--
-- Name: payments FK_c30d71dc38577724cd0e248dcc8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "FK_c30d71dc38577724cd0e248dcc8" FOREIGN KEY (collected_by) REFERENCES public.users(id);


--
-- Name: return_items FK_c57d201363c110de07d1fd32027; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT "FK_c57d201363c110de07d1fd32027" FOREIGN KEY (order_item_id) REFERENCES public.order_items(id);


--
-- Name: shop_orders FK_c67c3ed4f24af42648fac17e0f0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_orders
    ADD CONSTRAINT "FK_c67c3ed4f24af42648fac17e0f0" FOREIGN KEY (shop_id) REFERENCES public.shops(id);


--
-- Name: gift_cards FK_c8ed925445accc3214771e79ca1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_cards
    ADD CONSTRAINT "FK_c8ed925445accc3214771e79ca1" FOREIGN KEY (market_id) REFERENCES public.markets(id);


--
-- Name: conversations FK_c9f0434c15cacf894e996f69088; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT "FK_c9f0434c15cacf894e996f69088" FOREIGN KEY (customer_id) REFERENCES public.users(id);


--
-- Name: shop_payouts FK_cd10dc43e2ba3ba6a430375772b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_payouts
    ADD CONSTRAINT "FK_cd10dc43e2ba3ba6a430375772b" FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: order_items FK_ce507559d955e3fdb64a4b6ccb0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "FK_ce507559d955e3fdb64a4b6ccb0" FOREIGN KEY (shop_order_id) REFERENCES public.shop_orders(id) ON DELETE CASCADE;


--
-- Name: support_ticket_notes FK_ce997a05626cd5a5861ca288dda; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.support_ticket_notes
    ADD CONSTRAINT "FK_ce997a05626cd5a5861ca288dda" FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id) ON DELETE CASCADE;


--
-- Name: gift_card_transactions FK_d0b40340d3fd81c1d7bb20dcc59; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gift_card_transactions
    ADD CONSTRAINT "FK_d0b40340d3fd81c1d7bb20dcc59" FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: markets FK_d264561c1d0860970b7ca2658ff; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT "FK_d264561c1d0860970b7ca2658ff" FOREIGN KEY (area_id) REFERENCES public.areas(id);


--
-- Name: ad_campaigns FK_d26afaffdc093b3583bf73c2a67; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_campaigns
    ADD CONSTRAINT "FK_d26afaffdc093b3583bf73c2a67" FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: return_requests FK_d41ab0aabff469545a236887561; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_requests
    ADD CONSTRAINT "FK_d41ab0aabff469545a236887561" FOREIGN KEY (customer_id) REFERENCES public.users(id);


--
-- Name: shop_orders FK_d6598b76bf90c1f53ef7dea2e3c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_orders
    ADD CONSTRAINT "FK_d6598b76bf90c1f53ef7dea2e3c" FOREIGN KEY (pickup_point_id) REFERENCES public.pickup_points(id);


--
-- Name: market_members FK_daf3c24d1f5abf726abbea06778; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_members
    ADD CONSTRAINT "FK_daf3c24d1f5abf726abbea06778" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: shop_verifications FK_db05a3df11011f0f3629084b9b8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_verifications
    ADD CONSTRAINT "FK_db05a3df11011f0f3629084b9b8" FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;


--
-- Name: order_items FK_db2d0ea722e16e0fe8ab3bce111; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "FK_db2d0ea722e16e0fe8ab3bce111" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);


--
-- Name: shops FK_db81021849f3006faad9b2242c8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT "FK_db81021849f3006faad9b2242c8" FOREIGN KEY (market_id) REFERENCES public.markets(id);


--
-- Name: price_offers FK_de203ed1e53a112cc5faa919d55; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_offers
    ADD CONSTRAINT "FK_de203ed1e53a112cc5faa919d55" FOREIGN KEY (responded_by) REFERENCES public.users(id);


--
-- Name: shop_payout_accounts FK_de5fe1066db7e38e4ebf4fba58e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_payout_accounts
    ADD CONSTRAINT "FK_de5fe1066db7e38e4ebf4fba58e" FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE CASCADE;


--
-- Name: return_requests FK_e432a7251bc55359ce655fcc92d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_requests
    ADD CONSTRAINT "FK_e432a7251bc55359ce655fcc92d" FOREIGN KEY (shop_order_id) REFERENCES public.shop_orders(id);


--
-- Name: delivery_shop_orders FK_e4763671730f3d1323f9132cf5d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_shop_orders
    ADD CONSTRAINT "FK_e4763671730f3d1323f9132cf5d" FOREIGN KEY (shop_order_id) REFERENCES public.shop_orders(id);


--
-- Name: deliveries FK_e4ca3c1d4c3c348818b524a071a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT "FK_e4ca3c1d4c3c348818b524a071a" FOREIGN KEY (rider_id) REFERENCES public.riders(user_id);


--
-- Name: cart_items FK_ede780fc2b865d1d1323e598038; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "FK_ede780fc2b865d1d1323e598038" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE;


--
-- Name: shop_categories FK_ee4fccaada563c04413b8916d07; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_categories
    ADD CONSTRAINT "FK_ee4fccaada563c04413b8916d07" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: shop_members FK_f0147e76ed9a1c177f667304dfc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_members
    ADD CONSTRAINT "FK_f0147e76ed9a1c177f667304dfc" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: shop_verifications FK_f1c4af95cc49f455e997cd6725d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_verifications
    ADD CONSTRAINT "FK_f1c4af95cc49f455e997cd6725d" FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: market_floors FK_f21491d640498f453bd4efc5957; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_floors
    ADD CONSTRAINT "FK_f21491d640498f453bd4efc5957" FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: shop_subscriptions FK_f3d2c254e2d2e0b6955722a5b70; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_subscriptions
    ADD CONSTRAINT "FK_f3d2c254e2d2e0b6955722a5b70" FOREIGN KEY (shop_id) REFERENCES public.shops(id);


--
-- Name: pickup_points FK_f6f48129fcb8d6c1f9290a7fce8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pickup_points
    ADD CONSTRAINT "FK_f6f48129fcb8d6c1f9290a7fce8" FOREIGN KEY (floor_id) REFERENCES public.market_floors(id);


--
-- Name: return_items FK_f94d86e7bffa6494f57d9263a4a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.return_items
    ADD CONSTRAINT "FK_f94d86e7bffa6494f57d9263a4a" FOREIGN KEY (return_request_id) REFERENCES public.return_requests(id) ON DELETE CASCADE;


--
-- Name: commission_rules FK_fdde897e9a88658d1b645e46f92; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_rules
    ADD CONSTRAINT "FK_fdde897e9a88658d1b645e46f92" FOREIGN KEY (market_id) REFERENCES public.markets(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 06XhPdrpW5SmWeyNayklEGZlZiPy4sa94ijyeO264UbofWdQERB9AvnpiGFaThu

