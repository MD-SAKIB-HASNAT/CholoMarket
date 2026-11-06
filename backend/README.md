# Cholo Market API (NestJS)

See the [project README](../README.md) for setup, demo accounts and features, and [docs/DATABASE.md](../docs/DATABASE.md) for the schema.

| Script | What it does |
|---|---|
| `npm run start:dev` | API on http://localhost:4000/api (Swagger at `/api/docs`) with watch mode |
| `npm run migration:run` / `:revert` / `:show` | Apply / roll back / inspect migrations |
| `npm run migration:generate -- Name` | Diff entities against the database and write a migration |
| `npm run seed` | **Wipe** the database and load demo data (refuses when `NODE_ENV=production`) |
| `npm run demo:history` | With the API running: place, fulfil and backdate ~40 realistic orders |
| `npm run smoke` | With the API running on fresh seed data: 57 end-to-end checks |
| `npm run build` / `start:prod` | Production build / run `dist/main.js` |

## Layout

Follows the Shukhee-api conventions; the rules are in [docs/CODE-STRUCTURE.md](../docs/CODE-STRUCTURE.md).

```
src/
  <module>/          controllers/  services/  dto/  (processors/  helpers/)  <module>.module.ts
    auth/            phone + OTP login, addresses, AuthGuard / RolesGuard / @Roles, AccessService
    catalog/         markets, shops, products, brands, categories, banners, search, wishlist, follows
    geo/             division / district / area / sub-area and Nearby
    cart/ chat/      one cart across shops; conversations and "make an offer"
    orders/          checkout, order workflow, payments, inventory and ledger services
    courier/         Steadfast and the provider interface
    shop-portal/ market-portal/ admin/    the three panels
    platform/ jobs/  settings, notifications, uploads; maintenance queue
  common/            ResponseInterceptor, cursor pagination, helpers
  database/
    enums/           status and kind lists
    postgres/        entities/<domain>/*.entity.ts, migrations, PostgresService
```
