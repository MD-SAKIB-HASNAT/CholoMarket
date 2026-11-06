# Cholo Market web app (Next.js)

See the [project README](../README.md) for setup and demo accounts.

```bash
npm run dev     # http://localhost:3000 (expects the API at NEXT_PUBLIC_API_URL)
npm run build   # production build
npm run lint
```

## Layout

```
src/
  app/
    (store)/               customer storefront: home, markets (+ mall walk-through), shops, products,
                           search, categories, cart, checkout, pay (sandbox wallet), orders, offers,
                           messages, wishlist, account
    login/                 phone + OTP
    portal/shop/[shopId]/  shop owner / staff dashboard
    portal/market/[marketId]/  mall management + pickup desk
    admin/                 platform admin console
  components/
    ui/                    shadcn/ui (Base UI flavour: compose with `render`, not `asChild`)
    shared/                product/shop/market cards, media placeholders, badges, form helpers
    dashboard/             sidebar shell, stat cards, charts
    site/                  header, footer, user menu, notifications
  lib/                     api client, auth (token store + React Query), types, formatting
```

Public catalogue pages are server components that fetch the API per request, so search engines see real content.
Signed-in pages are client components using TanStack Query with the JWT from `localStorage`.
