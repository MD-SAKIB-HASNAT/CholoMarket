type Id = number | string;

/** API paths used by the storefront (public, auth and customer areas). */
export const STORE_ENDPOINTS = {
  auth: {
    me: '/auth/me',
    otpRequest: '/auth/otp/request',
    otpVerify: '/auth/otp/verify',
  },
  products: {
    list: '/products',
    byId: (id: Id) => `/products/${id}`,
  },
  shops: {
    list: '/shops',
    following: '/me/following',
    bySlug: (slug: Id) => `/shops/${slug}`,
    follow: (shopId: Id) => `/shops/${shopId}/follow`,
  },
  markets: {
    list: '/markets',
    bySlug: (slug: Id) => `/markets/${slug}`,
    directory: (slug: Id) => `/markets/${slug}/directory`,
  },
  categories: {
    list: '/categories',
    bySlug: (slug: Id) => `/categories/${slug}`,
  },
  brands: {
    list: '/brands',
  },
  cart: {
    root: '/cart',
    items: '/cart/items',
    itemById: (itemId: Id) => `/cart/items/${itemId}`,
  },
  orders: {
    list: '/orders',
    checkout: '/orders/checkout',
    byOrderNo: (orderNo: Id) => `/orders/${orderNo}`,
    pay: (orderNo: Id) => `/orders/${orderNo}/pay`,
    cancelShopOrder: (orderNo: Id, shopOrderId: Id) =>
      `/orders/${orderNo}/shop-orders/${shopOrderId}/cancel`,
  },
  payments: {
    byId: (paymentId: Id) => `/payments/${paymentId}`,
    mockComplete: (paymentId: Id) => `/payments/${paymentId}/mock-complete`,
  },
  reviews: {
    list: '/reviews',
  },
  returns: {
    list: '/returns',
  },
  wishlist: {
    list: '/wishlist',
    byProductId: (productId: Id) => `/wishlist/${productId}`,
  },
  offers: {
    list: '/offers',
    respond: (offerId: Id) => `/offers/${offerId}/respond`,
  },
  messages: {
    conversations: '/conversations',
    conversationById: (conversationId: Id) => `/conversations/${conversationId}`,
    conversationMessages: (conversationId: Id) => `/conversations/${conversationId}/messages`,
  },
  addresses: {
    mine: '/me/addresses',
  },
  notifications: {
    list: '/notifications',
    readAll: '/notifications/read-all',
    read: (notificationId: Id) => `/notifications/${notificationId}/read`,
  },
  geo: {
    level: (segment: string) => `/geo/${segment}`,
  },
  search: {
    root: '/search',
  },
  banners: {
    list: '/banners',
  },
  stats: {
    root: '/stats',
  },
  platform: {
    config: '/config',
  },
  nearby: {
    map: '/nearby/map',
  },
  uploads: {
    image: '/uploads/image',
  },
} as const;
