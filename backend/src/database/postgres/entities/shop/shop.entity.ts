import { SHOP_STATUSES, inList, type ShopStatus } from 'src/database/enums';
import {
  CoordinateColumn,
  CreatedAt,
  IdColumn,
  PercentColumn,
  StatusColumn,
  Timestamp,
  UpdatedAt,
  numericTransformer,
} from 'src/database/postgres/columns';
import { Category } from 'src/database/postgres/entities/catalog/category.entity';
import { Area } from 'src/database/postgres/entities/geo/area.entity';
import { MarketFloor } from 'src/database/postgres/entities/market/market-floor.entity';
import { Market } from 'src/database/postgres/entities/market/market.entity';
import { ShopCategory } from 'src/database/postgres/entities/shop/shop-category.entity';
import { ShopMember } from 'src/database/postgres/entities/shop/shop-member.entity';
import { User } from 'src/database/postgres/entities/user/user.entity';
import {
  Check,
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  type Relation,
} from 'typeorm';

@Entity('shops')
@Check('CHK_shops_status', inList('status', SHOP_STATUSES))
@Check('CHK_shops_location', '"market_id" IS NOT NULL OR "area_id" IS NOT NULL')
@Check('CHK_shops_deposit', '"deposit_percent" BETWEEN 0 AND 100')
@Index('IDX_shops_walk', ['marketId', 'floorId', 'walkOrder'])
@Index('UQ_shops_market_number', ['marketId', 'shopNumber'], {
  unique: true,
  where: '"shop_number" IS NOT NULL AND "deleted_at" IS NULL',
})
export class Shop {
  @IdColumn()
  id: number;

  @Column({ type: 'text', unique: true })
  slug: string;

  /** NULL = standalone shop outside a mall (future). */
  @Column({ type: 'int', nullable: true })
  marketId: number | null;

  @ManyToOne(() => Market)
  @JoinColumn({ name: 'market_id' })
  market: Relation<Market> | null;

  @Column({ type: 'int', nullable: true })
  floorId: number | null;

  @ManyToOne(() => MarketFloor)
  @JoinColumn({ name: 'floor_id' })
  floor: Relation<MarketFloor> | null;

  /** e.g. "L3-42" */
  @Column({ type: 'text', nullable: true })
  shopNumber: string | null;

  /** Wing / block / row. */
  @Column({ type: 'text', nullable: true })
  block: string | null;

  /** Position in the mall walk-through. */
  @Column({ type: 'int', nullable: true })
  walkOrder: number | null;

  /** Pin position on the floor map, 0-100 %. */
  @Column({
    type: 'numeric',
    precision: 6,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  mapX: number | null;

  @Column({
    type: 'numeric',
    precision: 6,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  mapY: number | null;

  @Column({ type: 'text' })
  nameEn: string;

  @Column({ type: 'text', nullable: true })
  nameBn: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  logoUrl: string | null;

  @Column({ type: 'text', nullable: true })
  coverUrl: string | null;

  @Column({ type: 'varchar', length: 14, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 14, nullable: true })
  whatsapp: string | null;

  /** For standalone shops. */
  @Column({ type: 'int', nullable: true })
  areaId: number | null;

  @ManyToOne(() => Area)
  @JoinColumn({ name: 'area_id' })
  area: Relation<Area> | null;

  @Column({ type: 'text', nullable: true })
  addressLine: string | null;

  @CoordinateColumn()
  latitude: number | null;

  @CoordinateColumn()
  longitude: number | null;

  @Index()
  @Column({ type: 'int', nullable: true })
  primaryCategoryId: number | null;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'primary_category_id' })
  primaryCategory: Relation<Category> | null;

  // ---- policies ----
  /** "Make an offer" bargaining. */
  @Column({ type: 'boolean', default: true })
  acceptsOffers: boolean;

  @Column({ type: 'boolean', default: true })
  acceptsCashOnPickup: boolean;

  /** Ships orders by courier (home delivery, cash on delivery). */
  @Column({ type: 'boolean', default: true })
  offersDelivery: boolean;

  /** % of the order the customer must pay online up front (0 = none). */
  @PercentColumn({ default: 0 })
  depositPercent: number;

  /** How long items are held for pickup. */
  @Column({ type: 'smallint', default: 24 })
  reservationHours: number;

  @Column({ type: 'smallint', default: 3 })
  returnWindowDays: number;

  @Column({ type: 'text', nullable: true })
  returnPolicy: string | null;

  @Column({ type: 'text', nullable: true })
  warrantyPolicy: string | null;

  // ---- trust ----
  @StatusColumn('pending', 20)
  status: ShopStatus;

  /** Verified badge: approved trade licence + physical visit. */
  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Timestamp()
  verifiedAt: Date | null;

  @Column({
    type: 'numeric',
    precision: 3,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  ratingAvg: number;

  @Column({ type: 'int', default: 0 })
  ratingCount: number;

  /** Onboarding team member who signed the shop up. */
  @Column({ type: 'int', nullable: true })
  onboardedBy: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'onboarded_by' })
  onboarder: Relation<User> | null;

  @OneToMany(() => ShopMember, (m) => m.shop)
  members: Relation<ShopMember[]>;

  @OneToMany(() => ShopCategory, (c) => c.shop)
  categories: Relation<ShopCategory[]>;

  @CreatedAt()
  createdAt: Date;

  @UpdatedAt()
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
