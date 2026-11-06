import { LEDGER_KINDS, inList, type LedgerKind } from 'src/database/enums';
import {
  CreatedAt,
  IdColumn,
  MoneyColumn,
} from 'src/database/postgres/columns';
import { ShopOrder } from 'src/database/postgres/entities/order/shop-order.entity';
import { Refund } from 'src/database/postgres/entities/payment/refund.entity';
import { ShopPayout } from 'src/database/postgres/entities/revenue/shop-payout.entity';
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
 * What the platform owes each shop. Balance = SUM(amount); positive = owed to shop.
 *   online-paid sale  +sale, -commission
 *   cash at pickup    +online part only, -commission (the shop already holds the cash)
 *   refund / payout / fees  negative
 */
@Entity('shop_ledger_entries')
@Check('CHK_shop_ledger_kind', inList('kind', LEDGER_KINDS))
@Index(['shopId', 'createdAt'])
export class ShopLedgerEntry {
  @IdColumn()
  id: number;

  @Column({ type: 'int' })
  shopId: number;

  @ManyToOne(() => Shop)
  @JoinColumn({ name: 'shop_id' })
  shop: Relation<Shop>;

  @Column({ type: 'varchar', length: 20 })
  kind: LedgerKind;

  @MoneyColumn()
  amount: number;

  @Column({ type: 'int', nullable: true })
  shopOrderId: number | null;

  @ManyToOne(() => ShopOrder)
  @JoinColumn({ name: 'shop_order_id' })
  shopOrder: Relation<ShopOrder> | null;

  @Column({ type: 'int', nullable: true })
  refundId: number | null;

  @ManyToOne(() => Refund)
  @JoinColumn({ name: 'refund_id' })
  refund: Relation<Refund> | null;

  @Column({ type: 'int', nullable: true })
  payoutId: number | null;

  @ManyToOne(() => ShopPayout)
  @JoinColumn({ name: 'payout_id' })
  payout: Relation<ShopPayout> | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreatedAt()
  createdAt: Date;
}
