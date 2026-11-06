import {
  CreatedAt,
  IdColumn,
  PercentColumn,
} from 'src/database/postgres/columns';
import { Category } from 'src/database/postgres/entities/catalog/category.entity';
import { Market } from 'src/database/postgres/entities/market/market.entity';
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

/**
 * Most specific active rule wins: shop > market > category > global (all null).
 * The zero-commission launch period is a global rule with rate 0 and an end date.
 */
@Entity('commission_rules')
@Check('CHK_commission_rules_rate', '"rate" BETWEEN 0 AND 100')
@Index(['categoryId', 'validFrom'])
export class CommissionRule {
  @IdColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  categoryId: number | null;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Relation<Category> | null;

  @Column({ type: 'int', nullable: true })
  marketId: number | null;

  @ManyToOne(() => Market)
  @JoinColumn({ name: 'market_id' })
  market: Relation<Market> | null;

  @Column({ type: 'int', nullable: true })
  shopId: number | null;

  @ManyToOne(() => Shop)
  @JoinColumn({ name: 'shop_id' })
  shop: Relation<Shop> | null;

  /** Percent. */
  @PercentColumn()
  rate: number;

  @Column({ type: 'timestamptz' })
  validFrom: Date;

  @Column({ type: 'timestamptz', nullable: true })
  validTo: Date | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'int', nullable: true })
  createdBy: number | null;

  @CreatedAt()
  createdAt: Date;
}
