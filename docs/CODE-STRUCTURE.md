# Code structure

The code follows the same conventions as the **Shukhee-api** (backend) and **shukhee-website** (frontend) projects, so anyone who knows one can read the other.

Two deliberate differences: the backend talks to **PostgreSQL** (Shukhee uses MySQL) and the frontend is **TypeScript** (shukhee-website is JavaScript).

## Backend (`backend/`)

NestJS, CommonJS output, absolute imports (`import … from 'src/…'`), Prettier (`singleQuote`, `trailingComma: all`).

```
src/
├── main.ts, app.module.ts
├── <module>/                      one folder per domain
│   ├── <module>.module.ts
│   ├── controllers/               HTTP only: routes, guards, { message, result }
│   ├── services/                  business logic and queries
│   ├── dto/                       request / query validation
│   ├── processors/                BullMQ workers (where the module has any)
│   └── helpers/                   small pure helpers of the module
├── auth/                          login, addresses, AuthGuard, RolesGuard, @Roles, AccessService
├── catalog/ geo/ cart/ orders/ chat/ courier/ platform/ jobs/
├── admin/ shop-portal/ market-portal/   the three panels
├── common/
│   ├── interceptor/response.interceptor.ts   { success, statusCode, message, data }
│   ├── pagination/                keyset cursor toolkit (limit, cursor → items, nextCursor, hasMore)
│   ├── helper/util.ts
│   └── redis.module.ts
└── database/
    ├── enums/                     status / kind lists, one file per domain (+ in-list.ts)
    └── postgres/
        ├── entities/<domain>/<name>.entity.ts   one class per file
        ├── migrations/            schema changes only ever happen here
        ├── columns.ts, snake-naming.strategy.ts, options.ts, data-source.ts
        ├── postgres.module.ts
        └── postgres.service.ts    every repository as a property + the DataSource
```

### Rules

- **Controllers are thin.** They validate input (DTOs), pick the guards and call one service method. They return `{ message, result }`; the `ResponseInterceptor` turns that into `{ success, statusCode, message, data }`.
- **Guards are per controller or per route**: `@UseGuards(AuthGuard, RolesGuard)` plus `@Roles(Role.…)`. Public routes have no guard; `@UseGuards(OptionalAuthGuard)` is for public pages that personalise when someone is signed in.
- **One data service.** Services never inject repositories one by one; they use `this.postgresService.shops`, `this.postgresService.dataSource`, and so on.
- **Every list is cursor-paged** (`keysetIds` + `toCursorPage`), never offset-paged and without totals. Counts live in `GET /stats`.
- Errors keep Nest's usual body (`{ statusCode, message }`); the web app reads `message`.

### Scripts

`npm run start:dev`, `build`, `migration:run`, `seed`, `seed:geo`, `seed:brands`, `smoke` (end-to-end check against a running API), `demo:history`.

## Frontend (`frontend/`)

Next.js 16 App Router, TypeScript, Tailwind, Prettier (`semi`, `singleQuote`, 100 columns, `arrowParens: avoid`).

```
src/
├── app/
│   ├── layout.tsx, globals.css
│   ├── (public)/                  home, markets, shops, products, categories, search
│   │   └── components/            parts used only by these routes
│   ├── (auth)/login/
│   ├── (protected)/
│   │   ├── (customer)/            account, cart, checkout, orders, wishlist, offers, messages, pay
│   │   ├── admin/                 admin console   (components/, utils/ next to the pages)
│   │   └── portal/                shop/[shopId] and market/[marketId] panels (components/, hooks/)
│   └── banners/[name]/route.tsx
├── components/
│   ├── ui/                        shadcn primitives
│   ├── site/ shared/ home/ dashboard/ providers/    PascalCase.tsx
└── utils/
    ├── api/                       fetch wrapper, unwraps { data }
    ├── endpoints/                 every API path in one place (store, admin, portal)
    ├── context/AuthContext.tsx
    ├── hooks/useCursorList.ts
    ├── helpers/                   format, cn, panel, locationParams
    └── types/
```

### Rules

- Route groups (`(public)`, `(auth)`, `(protected)`) do not change URLs; they say who may see a page.
- A route's own pieces live beside it (`components/`, `hooks/`, `utils/`); anything shared goes to `src/components` or `src/utils`.
- Components are `PascalCase.tsx`; helpers and hooks are `camelCase.ts`.
- API paths come from `utils/endpoints`, not from string literals in pages.
- Lists use `useCursorList` with `<LoadMore>` / `<CursorList>`.
