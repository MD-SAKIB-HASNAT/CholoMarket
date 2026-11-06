import {
  COUPON_FUNDERS,
  DISCOUNT_TYPES,
  inList,
  type DiscountType,
} from 'src/database/enums';
import {
  CreatedAt,
  IdColumn,
  MoneyColumn,
} from 'src/database/postgres/columns';
import { Market } from 'src/database/postgres/entities/market/market.entity';
import { Shop } from 'src/database/postgres/entities/shop/shop.entity';
import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

@Entity('coupons')
@Check('CHK_coupons_funder', inList('funded_by', COUPON_FUNDERS))
@Check('CHK_coupons_type', inList('discount_type', DISCOUNT_TYPES))
@Check('CHK_coupons_value', '"discount_value" > 0')
export class Coupon {
  @IdColumn()
  id: number;

  @Column({ type: 'text', unique: true })
  code: string;

  @Column({ type: 'varchar', length: 10 })
  fundedBy: 'platform' | 'shop' | 'market';

  /** Restrict to one shop. */
  @Column({ type: 'int', nullable: true })
  shopId: number | null;

  @ManyToOne(() => Shop)
  @JoinColumn({ name: 'shop_id' })
  shop: Relation<Shop> | null;

  /** Mall-wide coupon, e.g. an Eid festival. */
  @Column({ type: 'int', nullable: true })
  marketId: number | null;

  @ManyToOne(() => Market)
  @JoinColumn({ name: 'market_id' })
  market: Relation<Market> | null;

  @Column({ type: 'varchar', length: 10 })
  discountType: DiscountType;

  @MoneyColumn()
  discountValue: number;

  @MoneyColumn({ nullable: true })
  maxDiscount: number | null;

  @MoneyColumn({ default: 0 })
  minOrderTotal: number;

  @Column({ type: 'int', nullable: true })
  usageLimit: number | null;

  @Column({ type: 'int', default: 1 })
  perUserLimit: number;

  @Column({ type: 'int', default: 0 })
  usedCount: number;

  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'timestamptz' })
  endsAt: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreatedAt()
  createdAt: Date;
}
