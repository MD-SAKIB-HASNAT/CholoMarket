# Cholo Market — Bangladesh's malls & markets, online

Customers walk through a mall shop by shop (**mall → shop → product**), or search any market, shop or product in Bangla or English. They add items from many shops to one cart and order online. Each shop's parcel is either **delivered to the door by Steadfast courier with cash on delivery**, or **picked up in person** at the shop counter or the mall's pickup desk. Online payment is by **bKash or Nagad**.

| | |
|---|---|
| **Frontend** | Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) · Lucide icons · TanStack Query |
| **Backend** | NestJS 12 · TypeScript · REST · class-validator · Swagger · role-based authorization |
| **Database** | PostgreSQL 17 · TypeORM 1.1 (migrations) · 66 tables, see [docs/DATABASE.md](docs/DATABASE.md) |
| **Background work** | Redis + BullMQ: notifications, CSV bulk imports, courier status sync, pickup and offer expiry |
| **Delivery (3PL)** | Steadfast Courier (create order, status by consignment, balance, webhook). Provider interface ready for Pathao, RedX, Paperfly |

```
cholo-market/
├── docker-compose.yml   Postgres (port 5440) + Redis (port 6380)
├── backend/             NestJS API          → http://localhost:4000/api  (Swagger: /api/docs)
├── frontend/            Next.js web app     → http://localhost:3100
└── docs/                DATABASE.md (design), schema.sql (generated DDL), CODE-STRUCTURE.md
```

Code layout and conventions (same style as the Shukhee-api / shukhee-website projects): [docs/CODE-STRUCTURE.md](docs/CODE-STRUCTURE.md).

## Run it

Requirements: Node.js 20+ and Docker Desktop.

```bash
# 1. Database + Redis
docker compose up -d

# 2. API: install, create tables, load demo data, start
cd backend
npm install
cp .env.example .env        # already present in this repo for local dev
npm run db:setup            # migrations + seed (wipes data!)
npm run start:dev

# already have data and only need the places (8 divisions, 64 districts, sample areas and
# sub-areas)? This adds them without touching anything else, and is safe to repeat:
# npm run seed:geo

# optional, in another terminal while the API runs: a month of realistic orders,
# reviews and payouts so the dashboards have something to show
npm run demo:history

# 3. Web app (new terminal)
cd frontend
npm install
npm run dev
```

On Windows you can run `.\start-dev.ps1` from this folder instead. It starts Docker and both servers in their own windows.

Open http://localhost:3100. In development the OTP is **shown on the login screen**, so no SMS is needed.

### Demo accounts (log in with phone + OTP)

| Role | Phone | What to try |
|---|---|---|
| Customer | `01800000001` | Walk through *Shapla City Mall*, bargain on earbuds, check out with desk pickup |
| Shop owner, Gadget Zone | `01711000002` | `/portal/shop/2`: confirm orders, hand over with the pickup code, answer offers, one-tap stock |
| Shop owner, Nakshi Style House | `01711000001` | `/portal/shop/1` |
| Mall admin, Shapla City Mall | `01700000010` | `/portal/market/1`: dashboard, shops |
| Pickup-desk staff | `01700000011` | `/portal/market/1/desk`: hand over desk orders |
| Super admin | `01700000001` | `/admin`: onboard shops, verify badges, commission, payouts |
| Onboarding / Finance staff | `01700000002` / `01700000003` | Admin console with role-limited actions |

Shop owners `01711000001` … `01711000013` each own one seeded shop. Coupons: `EID10` (10%, max ৳500) and `SHAPLA200` (৳200 off at Shapla City Mall).

## Features

**Customers**
- Malls and markets with a floor-by-floor directory, a floor-plan view with pins, and a **"walk shop by shop"** mode.
- **Products**: search by name (Bangla or English, typo tolerant), filter by **category** (with its sub-categories) and **brand**, or tap **Nearby** to see products from shops close to you. The product list has no market or shop filters.
- **Find markets and shops by place**: filter by Division → District → Area → Sub-area, or tap **Nearby** (uses the phone's location) to see only markets and shops within the distance the admin has set, nearest first, with "320 m away" on each card.
- One search box for malls, shops and products: Bangla or English, typo-tolerant (pg_trgm + full-text), with category and sort filters.
- Product pages with variants (size, colour, etc.), live stock and a "stock updated X ago" note, wishlist, and similar items from other shops.
- **Make an offer** (bargaining): the shop can accept, counter or decline, and a hidden minimum price auto-rejects lowball offers. Accepted prices carry through to the cart.
- Home page built for browsing: **banner carousel** (managed in admin), the mall → shop → product journey, popular searches, a price-drop row, a "mall of the week" spotlight, recently viewed items, and an endless "keep exploring" grid with tabs.
- One cart across many shops. At checkout the customer picks, for each shop, **home delivery**, the **shop counter** or the **mall pickup desk**. Delivery addresses can be saved; the charge follows the zone (৳70 inside Dhaka, ৳130 outside, set by admin).
- Payment: **cash on delivery / cash at pickup**, or **bKash/Nagad** now. Shops can ask for an advance, and customers who missed pickups before must pay one.
- Each shop's part of an order has its own timeline. Delivery parts show the **Steadfast consignment, tracking link and courier history**; pickup parts get a **6-digit pickup code**. Customers can cancel (with refund), review after receiving, and request returns.
- Chat with shops, in-app notifications, and an account page with followed shops.

**Shops** (`/portal/shop/:id`)
- Dashboard with sales chart, low stock, balance, and orders waiting.
- Orders: confirm → **send with Steadfast** (delivery) or ready → hand over by pickup code (pickup), or reject.
- **Deliveries**: every parcel with its consignment, cash to collect, courier status and tracking. Status comes from Steadfast's webhook, with a background sync as backup. Delivered → order completed and COD recorded; returned → stock back and online payment refunded.
- **Delivery settings**: turn home delivery on or off, connect Steadfast accounts (API key + secret, or test mode), test the connection, pick the default account.
- Products with variants and photos; **one-tap stock** buttons (−1 sold in store, +1 restock, set count).
- **CSV bulk import**, processed by a background queue with per-row error reports.
- Offers, chat, returns, review replies, finance (ledger, payouts, payout accounts), settings (policies, hours, verification documents), and team members.

**Mall management and pickup desk** (`/portal/market/:id`)
- Market dashboard, shop list, and a tablet-friendly **pickup desk** that hands over orders by code.

**Admin, shop and mall accounts use their panel only.** They are sent to their panel as soon as they open the customer site, and the cart, checkout, offers and follows refuse them. Use a customer account to shop.

**Platform admin** (`/admin`)
- **Locations**: add, edit, hide or delete divisions, districts, areas and sub-areas, each tied to its parent (a district belongs to a division, and so on). Markets pick their place from these lists, and the **Nearby radius** (in metres) is a platform setting.
- Markets (floors, pickup desks, management team), shop onboarding (creates the owner's account), and verification review (**badge = trade licence + physical visit**).
- Categories, **commission rules** (shop > market > category > global, plus plan discounts, plus a zero-commission launch period), coupons, users and staff roles.
- **Home banners** (create, schedule, pause), **all shipments** across shops, and platform settings including delivery charges and the Steadfast webhook token.
- Finance: what is owed to each shop, with payouts. Orders, **zero-result search insights**, and an audit log.

## How the API is organised

- **Cursor pagination everywhere.** Every list takes `?limit=` (default 20, at most 50) and `?cursor=` and answers `{ items, nextCursor, hasMore }`; send `nextCursor` back to get the next page. Pages are found by comparing the sort columns with the last row (keyset), so page 500 is as fast as page 1 and rows added meanwhile never repeat or vanish. Lists carry no totals; the home page's headline numbers come from `GET /stats`. The toolkit is in `backend/src/common/pagination`.
- **Two global guards.** `AuthGuard` checks the Bearer token (routes marked `@Public()` / `@OptionalAuth()` skip it). `RolesGuard` then checks the route's `@Roles(...)`: `Role.Ops`, `Role.Onboarding`… for the admin team, `Role.ShopOwner` / `ShopManager` / `ShopStaff` for the shop in the URL, `Role.MarketAdmin`… for the market in the URL, and `Role.Customer` for shoppers. Any one listed role is enough; owners and market admins always pass their own panel, and the super admin passes everything. Controllers stay free of permission checks. The code is in `backend/src/common/auth`.
- **Catalog split by topic.** `modules/catalog` has one folder each for markets, shops, products, brands, categories, banners, search, wishlist and stats; each has a small controller and service. Place filters and "nearby" are shared through `modules/geo`.

## Background jobs (Redis + BullMQ)

| Queue | Job |
|---|---|
| `notifications` | Saves in-app notifications. In production this is where SMS (e.g. SSL Wireless) and FCM push go |
| `imports` | Parses CSV product uploads and creates or updates products by SKU |
| `maintenance` | Every minute: expires uncollected pickup orders (releases stock, refunds or forfeits the advance, counts the no-show) and cancels unpaid orders. Every 2 minutes: asks Steadfast for parcels it hasn't reported on. Every 10 minutes: expires stale offers |

## Testing

```bash
cd backend
npm run seed       # fresh data (the suite asserts exact balances)
npm run smoke      # 139 end-to-end checks against the running API
```

The smoke test covers:
- OTP login and role access
- Bangla, English and typo search, plus the mall walk-through
- bargaining, including the hidden minimum price
- a multi-shop cart and coupons
- bKash failure then retry
- shop and desk handover with pickup codes
- home delivery with cash on delivery: address saving, zone charges, booking with Steadfast, webhook (and a wrong token refused), stock and COD accounting
- a parcel returned by the courier: stock back and full refund
- cash plus deposit, cancellation with refund
- reviews, one-tap stock, CSV import through the queue
- ledger balance, admin payouts, and 403s for the wrong roles
- cursor pagination on every sort (pages match one big page, no repeats), product filters by name, category, brand and nearby, brand admin, and the role guards
- locations: the four-level pickers, market and shop filters by place, nearby search with the admin-set radius, location CRUD with its guards, and panel accounts being refused customer actions

## Going to production: what to swap

- **Payments:** `PaymentsService.mockComplete` stands in for the gateway. Implement bKash Tokenized Checkout and Nagad by calling the gateway's create-payment, redirecting the customer, and calling `PaymentsService.settle()` from the verified callback. Idempotency is already in place.
- **Steadfast:** in each shop's Delivery settings, connect a live account with the API key and secret from the Steadfast merchant panel. In Steadfast, set the webhook URL to `https://<api-host>/api/webhooks/steadfast` with the same Bearer token as the admin setting `steadfast_webhook_token`.
- **SMS:** send OTPs and order texts from `AuthService.requestOtp` and `NotificationsProcessor`.
- **Uploads:** `/api/uploads/image` writes to `backend/uploads/`. Point it to S3 or Cloudflare R2, with a private bucket for trade-licence documents.
- **Secrets:** set a strong `JWT_SECRET`, `NODE_ENV=production` (this hides `devCode`), real DB credentials and `CORS_ORIGINS`.
- **Build:** `npm run build && npm run start:prod` (API) and `npm run build && npm start` (web).
