import {
  AD_ADVERTISERS,
  AD_PLACEMENTS,
  AD_STATUSES,
  inList,
} from 'src/database/enums';
import {
  CreatedAt,
  IdColumn,
  MoneyColumn,
  StatusColumn,
} from 'src/database/postgres/columns';
import { Market } from 'src/database/postgres/entities/market/market.entity';
import { Product } from 'src/database/postgres/entities/product/product.entity';
import { Shop } from 'src/database/postgres/entities/shop/shop.entity';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

/** Featured shops, sponsored products, mall sponsorships, banners. */
@Entity('ad_campaigns')
@Check('CHK_ad_campaigns_advertiser', inList('advertiser', AD_ADVERTISERS))
@Check('CHK_ad_campaigns_placement', inList('placement', AD_PLACEMENTS))
@Check('CHK_ad_campaigns_status', inList('status', AD_STATUSES))
@Index(['placement', 'startsAt', 'endsAt'])
export class AdCampaign {
  @IdColumn()
  id: number;

  @Column({ type: 'varchar', length: 10 })
  advertiser: string;

  @Column({ type: 'int', nullable: true })
  shopId: number | null;

  @ManyToOne(() => Shop)
  @JoinColumn({ name: 'shop_id' })
  shop: Relation<Shop> | null;

  @Column({ type: 'int', nullable: true })
  marketId: number | null;

  @ManyToOne(() => Market)
  @JoinColumn({ name: 'market_id' })
  market: Relation<Market> | null;

  @Column({ type: 'int', nullable: true })
  productId: number | null;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product> | null;

  @Column({ type: 'varchar', length: 20 })
  placement: string;

  @Column({ type: 'int', nullable: true })
  categoryId: number | null;

  @Column({ type: 'text', nullable: true })
  title: string | null;

  @Column({ type: 'text', nullable: true })
  subtitle: string | null;

  @Column({ type: 'text', nullable: true })
  imageUrl: string | null;

  /** Taller crop for phones; falls back to imageUrl. */
  @Column({ type: 'text', nullable: true })
  mobileImageUrl: string | null;

  /** The artwork already carries its headline, so the site shows it without overlay text. */
  @Column({ type: 'boolean', default: false })
  imageHasText: boolean;

  /** Where the banner leads, e.g. /markets/shapla-city-mall */
  @Column({ type: 'text', nullable: true })
  linkUrl: string | null;

  @MoneyColumn({ default: 0 })
  price: number;

  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'timestamptz' })
  endsAt: Date;

  @StatusColumn('scheduled', 15)
  status: string;

  @Column({ type: 'bigint', default: 0 })
  impressions: string;

  @Column({ type: 'bigint', default: 0 })
  clicks: string;

  @CreatedAt()
  createdAt: Date;
}
