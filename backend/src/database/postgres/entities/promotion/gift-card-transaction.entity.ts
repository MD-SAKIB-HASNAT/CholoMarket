import { GIFT_CARD_TX_KINDS, inList } from 'src/database/enums';
import {
  CreatedAt,
  IdColumn,
  MoneyColumn,
} from 'src/database/postgres/columns';
import { Order } from 'src/database/postgres/entities/order/order.entity';
import { GiftCard } from 'src/database/postgres/entities/promotion/gift-card.entity';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

@Entity('gift_card_transactions')
@Check('CHK_gift_card_tx_kind', inList('kind', GIFT_CARD_TX_KINDS))
export class GiftCardTransaction {
  @IdColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  giftCardId: number;

  @ManyToOne(() => GiftCard)
  @JoinColumn({ name: 'gift_card_id' })
  giftCard: Relation<GiftCard>;

  @Column({ type: 'int', nullable: true })
  orderId: number | null;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Relation<Order> | null;

  @Column({ type: 'varchar', length: 10 })
  kind: string;

  /** + adds to balance, - spends. */
  @MoneyColumn()
  amount: number;

  @CreatedAt()
  createdAt: Date;
}
