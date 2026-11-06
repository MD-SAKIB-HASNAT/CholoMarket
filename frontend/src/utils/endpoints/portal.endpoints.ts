type Id = number | string;

export const PORTAL_ENDPOINTS = {
  shop: {
    dashboard: (shopId: Id) => `/shop-portal/${shopId}/dashboard`,
    orders: (shopId: Id) => `/shop-portal/${shopId}/orders`,
    order: (shopId: Id, shopOrderId: Id) => `/shop-portal/${shopId}/orders/${shopOrderId}`,
    orderAction: (shopId: Id, shopOrderId: Id) =>
      `/shop-portal/${shopId}/orders/${shopOrderId}/action`,
    orderShipment: (shopId: Id, shopOrderId: Id) =>
      `/shop-portal/${shopId}/orders/${shopOrderId}/shipment`,
    shipments: (shopId: Id) => `/shop-portal/${shopId}/shipments`,
    shipmentRefresh: (shopId: Id, shipmentId: Id) =>
      `/shop-portal/${shopId}/shipments/${shipmentId}/refresh`,
    shipmentMockStatus: (shopId: Id, shipmentId: Id) =>
      `/shop-portal/${shopId}/shipments/${shipmentId}/mock-status`,
    products: (shopId: Id) => `/shop-portal/${shopId}/products`,
    product: (shopId: Id, productId: Id) => `/shop-portal/${shopId}/products/${productId}`,
    productStatus: (shopId: Id, productId: Id) =>
      `/shop-portal/${shopId}/products/${productId}/status`,
    variantStock: (shopId: Id, variantId: Id) =>
      `/shop-portal/${shopId}/variants/${variantId}/stock`,
    imports: (shopId: Id) => `/shop-portal/${shopId}/imports`,
    importTemplate: (shopId: Id) => `/shop-portal/${shopId}/imports/template`,
    finance: (shopId: Id) => `/shop-portal/${shopId}/finance`,
    payoutAccounts: (shopId: Id) => `/shop-portal/${shopId}/payout-accounts`,
    members: (shopId: Id) => `/shop-portal/${shopId}/members`,
    member: (shopId: Id, userId: Id) => `/shop-portal/${shopId}/members/${userId}`,
    settings: (shopId: Id) => `/shop-portal/${shopId}/settings`,
    couriers: (shopId: Id) => `/shop-portal/${shopId}/couriers`,
    courier: (shopId: Id, courierAccountId: Id) =>
      `/shop-portal/${shopId}/couriers/${courierAccountId}`,
    courierTest: (shopId: Id, courierAccountId: Id) =>
      `/shop-portal/${shopId}/couriers/${courierAccountId}/test`,
    hours: (shopId: Id) => `/shop-portal/${shopId}/hours`,
    verifications: (shopId: Id) => `/shop-portal/${shopId}/verifications`,
    conversations: (shopId: Id) => `/shop-portal/${shopId}/conversations`,
    conversationMessages: (shopId: Id, conversationId: Id) =>
      `/shop-portal/${shopId}/conversations/${conversationId}/messages`,
    offers: (shopId: Id) => `/shop-portal/${shopId}/offers`,
    offerRespond: (shopId: Id, offerId: Id) => `/shop-portal/${shopId}/offers/${offerId}/respond`,
    returns: (shopId: Id) => `/shop-portal/${shopId}/returns`,
    returnRespond: (shopId: Id, returnId: Id) =>
      `/shop-portal/${shopId}/returns/${returnId}/respond`,
    reviews: (shopId: Id) => `/shop-portal/${shopId}/reviews`,
    reviewReply: (shopId: Id, reviewId: Id) => `/shop-portal/${shopId}/reviews/${reviewId}/reply`,
  },
  market: {
    dashboard: (marketId: Id) => `/market-portal/${marketId}/dashboard`,
    profile: (marketId: Id) => `/market-portal/${marketId}/profile`,
    shops: (marketId: Id) => `/market-portal/${marketId}/shops`,
    deskOrders: (marketId: Id) => `/market-portal/${marketId}/desk-orders`,
    deskOrderComplete: (marketId: Id, shopOrderId: Id) =>
      `/market-portal/${marketId}/desk-orders/${shopOrderId}/complete`,
  },
  shared: {
    brands: '/brands',
    categories: '/categories',
    conversation: (conversationId: Id) => `/conversations/${conversationId}`,
  },
};
