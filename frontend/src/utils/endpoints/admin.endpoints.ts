export const ADMIN_ENDPOINTS = {
  dashboard: '/admin/dashboard',
  insights: {
    searches: '/admin/search-insights',
  },
  users: {
    list: '/admin/users',
    staffRole: (id: number | string) => `/admin/users/${id}/staff-role`,
    status: (id: number | string) => `/admin/users/${id}/status`,
  },
  shops: {
    list: '/admin/shops',
    byId: (id: number | string) => `/admin/shops/${id}`,
    subscription: (shopId: number | string) => `/admin/shops/${shopId}/subscription`,
    visit: (shopId: number | string) => `/admin/shops/${shopId}/visit`,
  },
  markets: {
    list: '/admin/markets',
    byId: (id: number | string) => `/admin/markets/${id}`,
    floors: (marketId: number | string) => `/admin/markets/${marketId}/floors`,
    pickupPoints: (marketId: number | string) => `/admin/markets/${marketId}/pickup-points`,
    members: (marketId: number | string) => `/admin/markets/${marketId}/members`,
    memberById: (marketId: number | string, userId: number | string) =>
      `/admin/markets/${marketId}/members/${userId}`,
  },
  floors: {
    byId: (floorId: number | string) => `/admin/floors/${floorId}`,
  },
  pickupPoints: {
    byId: (pointId: number | string) => `/admin/pickup-points/${pointId}`,
  },
  orders: {
    list: '/admin/orders',
    byOrderNo: (orderNo: string) => `/admin/orders/${encodeURIComponent(orderNo)}`,
  },
  categories: {
    list: '/admin/categories',
    byId: (id: number | string) => `/admin/categories/${id}`,
  },
  brands: {
    list: '/admin/brands',
    byId: (id: number | string) => `/admin/brands/${id}`,
  },
  banners: {
    list: '/admin/banners',
    byId: (id: number | string) => `/admin/banners/${id}`,
  },
  coupons: {
    list: '/admin/coupons',
    byId: (id: number | string) => `/admin/coupons/${id}`,
  },
  commission: {
    rules: '/admin/commission-rules',
    endRule: (id: number | string) => `/admin/commission-rules/${id}/end`,
  },
  finance: {
    balances: '/admin/finance/balances',
    payouts: '/admin/finance/payouts',
  },
  shipments: {
    list: '/admin/shipments',
  },
  settings: {
    list: '/admin/settings',
    byKey: (key: string) => `/admin/settings/${key}`,
  },
  audit: {
    log: '/admin/audit-log',
  },
  verifications: {
    list: '/admin/verifications',
    review: (id: number | string) => `/admin/verifications/${id}/review`,
  },
  plans: {
    list: '/admin/plans',
  },
  geo: {
    list: (level: string) => `/admin/geo/${level}`,
    byId: (level: string, id: number | string) => `/admin/geo/${level}/${id}`,
  },
  shared: {
    geo: {
      // `suffix` is the optional `?param=value` query string, built by the caller.
      list: (level: string, suffix = '') => `/geo/${level}${suffix}`,
    },
  },
} as const;
