import { SUBSCRIPTION_STATUSES, inList } from 'src/database/enums';
import { CreatedAt, IdColumn } from 'src/database/postgres/columns';
import { SubscriptionPlan } from 'src/database/postgres/entities/revenue/subscription-plan.entity';
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

@Entity('shop_subscriptions')
@Check('CHK_shop_subscriptions_status', inList('status', SUBSCRIPTION_STATUSES))
@Index('UQ_shop_subscriptions_one_current', ['shopId'], {
  unique: true,
  where: `"status" IN ('trial', 'active', 'past_due')`,
})
export class ShopSubscription {
  @IdColumn()
  id: number;

  @Column({ type: 'int' })
  shopId: number;

  @ManyToOne(() => Shop)
  @JoinColumn({ name: 'shop_id' })
  shop: Relation<Shop>;

  @Column({ type: 'smallint' })
  planId: number;

  @ManyToOne(() => SubscriptionPlan)
  @JoinColumn({ name: 'plan_id' })
  plan: Relation<SubscriptionPlan>;

  @Column({ type: 'varchar', length: 15 })
  status: string;

  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endsAt: Date | null;

  @Column({ type: 'boolean', default: true })
  autoRenew: boolean;

  @CreatedAt()
  createdAt: Date;
}
