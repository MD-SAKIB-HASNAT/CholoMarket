import { PAYOUT_STATUSES, inList, type PayoutStatus } from 'src/database/enums';
import {
  CreatedAt,
  IdColumn,
  MoneyColumn,
  StatusColumn,
  Timestamp,
} from 'src/database/postgres/columns';
import { ShopPayoutAccount } from 'src/database/postgres/entities/shop/shop-payout-account.entity';
import { Shop } from 'src/database/postgres/entities/shop/shop.entity';
import { User } from 'src/database/postgres/entities/user/user.entity';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

@Entity('shop_payouts')
@Check('CHK_shop_payouts_status', inList('status', PAYOUT_STATUSES))
@Check('CHK_shop_payouts_amount', '"amount" > 0')
@Index(['shopId', 'createdAt'])
export class ShopPayout {
  @IdColumn()
  id: number;

  @Column({ type: 'int' })
  shopId: number;

  @ManyToOne(() => Shop)
  @JoinColumn({ name: 'shop_id' })
  shop: Relation<Shop>;

  @Column({ type: 'int', nullable: true })
  payoutAccountId: number | null;

  @ManyToOne(() => ShopPayoutAccount)
  @JoinColumn({ name: 'payout_account_id' })
  payoutAccount: Relation<ShopPayoutAccount> | null;

  @MoneyColumn()
  amount: number;

  @Column({ type: 'date' })
  periodStart: string;

  @Column({ type: 'date' })
  periodEnd: string;

  @StatusColumn('pending', 15)
  status: PayoutStatus;

  /** bKash trxID / bank reference. */
  @Column({ type: 'text', nullable: true })
  reference: string | null;

  @Column({ type: 'int', nullable: true })
  approvedBy: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approver: Relation<User> | null;

  @Timestamp()
  paidAt: Date | null;

  @CreatedAt()
  createdAt: Date;
}
