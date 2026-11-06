import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  AdCampaign,
  Area,
  AuditLog,
  Brand,
  Cart,
  CartItem,
  Category,
  CommissionRule,
  Conversation,
  Coupon,
  CouponRedemption,
  CourierAccount,
  Delivery,
  DeliveryShopOrder,
  District,
  Division,
  GiftCard,
  GiftCardTransaction,
  ImportJob,
  InventoryMovement,
  Market,
  MarketFloor,
  MarketMember,
  Message,
  Notification,
  Order,
  OrderItem,
  Payment,
  PaymentWebhookEvent,
  PickupPoint,
  PlatformSetting,
  PlatformStaff,
  PriceOffer,
  Product,
  ProductImage,
  ProductVariant,
  Refund,
  ReturnItem,
  ReturnRequest,
  Review,
  Rider,
  SearchQuery,
  Shipment,
  ShipmentEvent,
  Shop,
  ShopCategory,
  ShopFollow,
  ShopHours,
  ShopLedgerEntry,
  ShopMember,
  ShopOrder,
  ShopOrderEvent,
  ShopPayout,
  ShopPayoutAccount,
  ShopSubscription,
  ShopVerification,
  SizeChart,
  SubArea,
  SubscriptionPlan,
  SupportTicket,
  SupportTicketNote,
  User,
  UserAddress,
  UserDevice,
  WishlistItem,
} from 'src/database/postgres/entities';
import { DataSource, Repository } from 'typeorm';

/**
 * One place for all database access: every table's repository is a property here
 * (`this.postgresService.shops`), plus the DataSource for raw SQL and transactions.
 */
@Injectable()
export class PostgresService {
  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    @InjectRepository(ReturnRequest)
    readonly returnRequests: Repository<ReturnRequest>,
    @InjectRepository(ReturnItem) readonly returnItems: Repository<ReturnItem>,
    @InjectRepository(Review) readonly reviews: Repository<Review>,
    @InjectRepository(SupportTicket)
    readonly supportTickets: Repository<SupportTicket>,
    @InjectRepository(SupportTicketNote)
    readonly supportTicketNotes: Repository<SupportTicketNote>,
    @InjectRepository(Cart) readonly carts: Repository<Cart>,
    @InjectRepository(CartItem) readonly cartItems: Repository<CartItem>,
    @InjectRepository(Category) readonly categories: Repository<Category>,
    @InjectRepository(Brand) readonly brands: Repository<Brand>,
    @InjectRepository(SizeChart) readonly sizeCharts: Repository<SizeChart>,
    @InjectRepository(CourierAccount)
    readonly courierAccounts: Repository<CourierAccount>,
    @InjectRepository(Shipment) readonly shipments: Repository<Shipment>,
    @InjectRepository(ShipmentEvent)
    readonly shipmentEvents: Repository<ShipmentEvent>,
    @InjectRepository(Rider) readonly riders: Repository<Rider>,
    @InjectRepository(Delivery) readonly deliveries: Repository<Delivery>,
    @InjectRepository(DeliveryShopOrder)
    readonly deliveryShopOrders: Repository<DeliveryShopOrder>,
    @InjectRepository(WishlistItem)
    readonly wishlistItems: Repository<WishlistItem>,
    @InjectRepository(ShopFollow) readonly shopFollows: Repository<ShopFollow>,
    @InjectRepository(Conversation)
    readonly conversations: Repository<Conversation>,
    @InjectRepository(PriceOffer) readonly priceOffers: Repository<PriceOffer>,
    @InjectRepository(Message) readonly messages: Repository<Message>,
    @InjectRepository(Division) readonly divisions: Repository<Division>,
    @InjectRepository(District) readonly districts: Repository<District>,
    @InjectRepository(Area) readonly areas: Repository<Area>,
    @InjectRepository(SubArea) readonly subAreas: Repository<SubArea>,
    @InjectRepository(Market) readonly markets: Repository<Market>,
    @InjectRepository(MarketFloor)
    readonly marketFloors: Repository<MarketFloor>,
    @InjectRepository(MarketMember)
    readonly marketMembers: Repository<MarketMember>,
    @InjectRepository(PickupPoint)
    readonly pickupPoints: Repository<PickupPoint>,
    @InjectRepository(Order) readonly orders: Repository<Order>,
    @InjectRepository(ShopOrder) readonly shopOrders: Repository<ShopOrder>,
    @InjectRepository(OrderItem) readonly orderItems: Repository<OrderItem>,
    @InjectRepository(ShopOrderEvent)
    readonly shopOrderEvents: Repository<ShopOrderEvent>,
    @InjectRepository(Payment) readonly payments: Repository<Payment>,
    @InjectRepository(PaymentWebhookEvent)
    readonly paymentWebhookEvents: Repository<PaymentWebhookEvent>,
    @InjectRepository(Refund) readonly refunds: Repository<Refund>,
    @InjectRepository(Notification)
    readonly notifications: Repository<Notification>,
    @InjectRepository(PlatformSetting)
    readonly platformSettings: Repository<PlatformSetting>,
    @InjectRepository(SearchQuery)
    readonly searchQueries: Repository<SearchQuery>,
    @InjectRepository(AuditLog) readonly auditLogs: Repository<AuditLog>,
    @InjectRepository(ImportJob) readonly importJobs: Repository<ImportJob>,
    @InjectRepository(Product) readonly products: Repository<Product>,
    @InjectRepository(ProductVariant)
    readonly productVariants: Repository<ProductVariant>,
    @InjectRepository(ProductImage)
    readonly productImages: Repository<ProductImage>,
    @InjectRepository(InventoryMovement)
    readonly inventoryMovements: Repository<InventoryMovement>,
    @InjectRepository(Coupon) readonly coupons: Repository<Coupon>,
    @InjectRepository(CouponRedemption)
    readonly couponRedemptions: Repository<CouponRedemption>,
    @InjectRepository(GiftCard) readonly giftCards: Repository<GiftCard>,
    @InjectRepository(GiftCardTransaction)
    readonly giftCardTransactions: Repository<GiftCardTransaction>,
    @InjectRepository(CommissionRule)
    readonly commissionRules: Repository<CommissionRule>,
    @InjectRepository(SubscriptionPlan)
    readonly subscriptionPlans: Repository<SubscriptionPlan>,
    @InjectRepository(ShopSubscription)
    readonly shopSubscriptions: Repository<ShopSubscription>,
    @InjectRepository(ShopPayout) readonly shopPayouts: Repository<ShopPayout>,
    @InjectRepository(ShopLedgerEntry)
    readonly shopLedgerEntries: Repository<ShopLedgerEntry>,
    @InjectRepository(AdCampaign) readonly adCampaigns: Repository<AdCampaign>,
    @InjectRepository(Shop) readonly shops: Repository<Shop>,
    @InjectRepository(ShopMember) readonly shopMembers: Repository<ShopMember>,
    @InjectRepository(ShopCategory)
    readonly shopCategories: Repository<ShopCategory>,
    @InjectRepository(ShopHours) readonly shopHours: Repository<ShopHours>,
    @InjectRepository(ShopVerification)
    readonly shopVerifications: Repository<ShopVerification>,
    @InjectRepository(ShopPayoutAccount)
    readonly shopPayoutAccounts: Repository<ShopPayoutAccount>,
    @InjectRepository(User) readonly users: Repository<User>,
    @InjectRepository(PlatformStaff)
    readonly platformStaff: Repository<PlatformStaff>,
    @InjectRepository(UserDevice) readonly userDevices: Repository<UserDevice>,
    @InjectRepository(UserAddress)
    readonly userAddresses: Repository<UserAddress>,
  ) {}
}
