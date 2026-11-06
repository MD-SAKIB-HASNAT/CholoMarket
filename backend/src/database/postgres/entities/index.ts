import { ReturnItem } from './aftersale/return-item.entity';
import { ReturnRequest } from './aftersale/return-request.entity';
import { Review } from './aftersale/review.entity';
import { SupportTicketNote } from './aftersale/support-ticket-note.entity';
import { SupportTicket } from './aftersale/support-ticket.entity';
import { CartItem } from './cart/cart-item.entity';
import { Cart } from './cart/cart.entity';
import { Brand } from './catalog/brand.entity';
import { Category } from './catalog/category.entity';
import { SizeChart } from './catalog/size-chart.entity';
import { CourierAccount } from './courier/courier-account.entity';
import { ShipmentEvent } from './courier/shipment-event.entity';
import { Shipment } from './courier/shipment.entity';
import { DeliveryShopOrder } from './delivery/delivery-shop-order.entity';
import { Delivery } from './delivery/delivery.entity';
import { Rider } from './delivery/rider.entity';
import { Conversation } from './engagement/conversation.entity';
import { Message } from './engagement/message.entity';
import { PriceOffer } from './engagement/price-offer.entity';
import { ShopFollow } from './engagement/shop-follow.entity';
import { WishlistItem } from './engagement/wishlist-item.entity';
import { Area } from './geo/area.entity';
import { District } from './geo/district.entity';
import { Division } from './geo/division.entity';
import { SubArea } from './geo/sub-area.entity';
import { MarketFloor } from './market/market-floor.entity';
import { MarketMember } from './market/market-member.entity';
import { Market } from './market/market.entity';
import { PickupPoint } from './market/pickup-point.entity';
import { OrderItem } from './order/order-item.entity';
import { Order } from './order/order.entity';
import { ShopOrderEvent } from './order/shop-order-event.entity';
import { ShopOrder } from './order/shop-order.entity';
import { PaymentWebhookEvent } from './payment/payment-webhook-event.entity';
import { Payment } from './payment/payment.entity';
import { Refund } from './payment/refund.entity';
import { AuditLog } from './platform/audit-log.entity';
import { ImportJob } from './platform/import-job.entity';
import { Notification } from './platform/notification.entity';
import { PlatformSetting } from './platform/platform-setting.entity';
import { SearchQuery } from './platform/search-query.entity';
import { InventoryMovement } from './product/inventory-movement.entity';
import { ProductImage } from './product/product-image.entity';
import { ProductVariant } from './product/product-variant.entity';
import { Product } from './product/product.entity';
import { CouponRedemption } from './promotion/coupon-redemption.entity';
import { Coupon } from './promotion/coupon.entity';
import { GiftCardTransaction } from './promotion/gift-card-transaction.entity';
import { GiftCard } from './promotion/gift-card.entity';
import { AdCampaign } from './revenue/ad-campaign.entity';
import { CommissionRule } from './revenue/commission-rule.entity';
import { ShopLedgerEntry } from './revenue/shop-ledger-entry.entity';
import { ShopPayout } from './revenue/shop-payout.entity';
import { ShopSubscription } from './revenue/shop-subscription.entity';
import { SubscriptionPlan } from './revenue/subscription-plan.entity';
import { ShopCategory } from './shop/shop-category.entity';
import { ShopHours } from './shop/shop-hours.entity';
import { ShopMember } from './shop/shop-member.entity';
import { ShopPayoutAccount } from './shop/shop-payout-account.entity';
import { ShopVerification } from './shop/shop-verification.entity';
import { Shop } from './shop/shop.entity';
import { PlatformStaff } from './user/platform-staff.entity';
import { UserAddress } from './user/user-address.entity';
import { UserDevice } from './user/user-device.entity';
import { User } from './user/user.entity';

export * from './aftersale/return-item.entity';
export * from './aftersale/return-request.entity';
export * from './aftersale/review.entity';
export * from './aftersale/support-ticket-note.entity';
export * from './aftersale/support-ticket.entity';
export * from './cart/cart-item.entity';
export * from './cart/cart.entity';
export * from './catalog/brand.entity';
export * from './catalog/category.entity';
export * from './catalog/size-chart.entity';
export * from './courier/courier-account.entity';
export * from './courier/shipment-event.entity';
export * from './courier/shipment.entity';
export * from './delivery/delivery-shop-order.entity';
export * from './delivery/delivery.entity';
export * from './delivery/rider.entity';
export * from './engagement/conversation.entity';
export * from './engagement/message.entity';
export * from './engagement/price-offer.entity';
export * from './engagement/shop-follow.entity';
export * from './engagement/wishlist-item.entity';
export * from './geo/area.entity';
export * from './geo/district.entity';
export * from './geo/division.entity';
export * from './geo/sub-area.entity';
export * from './market/market-floor.entity';
export * from './market/market-member.entity';
export * from './market/market.entity';
export * from './market/pickup-point.entity';
export * from './order/order-item.entity';
export * from './order/order.entity';
export * from './order/shop-order-event.entity';
export * from './order/shop-order.entity';
export * from './payment/payment-webhook-event.entity';
export * from './payment/payment.entity';
export * from './payment/refund.entity';
export * from './platform/audit-log.entity';
export * from './platform/import-job.entity';
export * from './platform/notification.entity';
export * from './platform/platform-setting.entity';
export * from './platform/search-query.entity';
export * from './product/inventory-movement.entity';
export * from './product/product-image.entity';
export * from './product/product-variant.entity';
export * from './product/product.entity';
export * from './promotion/coupon-redemption.entity';
export * from './promotion/coupon.entity';
export * from './promotion/gift-card-transaction.entity';
export * from './promotion/gift-card.entity';
export * from './revenue/ad-campaign.entity';
export * from './revenue/commission-rule.entity';
export * from './revenue/shop-ledger-entry.entity';
export * from './revenue/shop-payout.entity';
export * from './revenue/shop-subscription.entity';
export * from './revenue/subscription-plan.entity';
export * from './shop/shop-category.entity';
export * from './shop/shop-hours.entity';
export * from './shop/shop-member.entity';
export * from './shop/shop-payout-account.entity';
export * from './shop/shop-verification.entity';
export * from './shop/shop.entity';
export * from './user/platform-staff.entity';
export * from './user/user-address.entity';
export * from './user/user-device.entity';
export * from './user/user.entity';

export const ENTITIES = [
  Division,
  District,
  Area,
  SubArea,
  User,
  PlatformStaff,
  UserDevice,
  UserAddress,
  Market,
  MarketFloor,
  MarketMember,
  PickupPoint,
  Category,
  Brand,
  SizeChart,
  Shop,
  ShopMember,
  ShopCategory,
  ShopHours,
  ShopVerification,
  ShopPayoutAccount,
  Product,
  ProductVariant,
  ProductImage,
  InventoryMovement,
  WishlistItem,
  ShopFollow,
  Conversation,
  Message,
  PriceOffer,
  Cart,
  CartItem,
  Coupon,
  CouponRedemption,
  GiftCard,
  GiftCardTransaction,
  Order,
  ShopOrder,
  OrderItem,
  ShopOrderEvent,
  Payment,
  PaymentWebhookEvent,
  Refund,
  ReturnRequest,
  ReturnItem,
  Review,
  SupportTicket,
  SupportTicketNote,
  CommissionRule,
  SubscriptionPlan,
  ShopSubscription,
  ShopPayout,
  ShopLedgerEntry,
  AdCampaign,
  Rider,
  Delivery,
  DeliveryShopOrder,
  CourierAccount,
  Shipment,
  ShipmentEvent,
  Notification,
  PlatformSetting,
  SearchQuery,
  AuditLog,
  ImportJob,
];
