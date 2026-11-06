import { GIFT_CARD_STATUSES, inList } from 'src/database/enums';
import {
  CreatedAt,
  IdColumn,
  MoneyColumn,
  StatusColumn,
} from 'src/database/postgres/columns';
import { Market } from 'src/database/postgres/entities/market/market.entity';
import { User } from 'src/database/postgres/entities/user/user.entity';
import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

@Entity('gift_cards')
@Check('CHK_gift_cards_status', inList('status', GIFT_CARD_STATUSES))
@Check('CHK_gift_cards_amounts', '"initial_amount" > 0 AND "balance" >= 0')
export class GiftCard {
  @IdColumn()
  id: number;

  /** Store a hash if printed on physical cards. */
  @Column({ type: 'text', unique: true })
  code: string;

  /** NULL = usable anywhere. */
  @Column({ type: 'int', nullable: true })
  marketId: number | null;

  @ManyToOne(() => Market)
  @JoinColumn({ name: 'market_id' })
  market: Relation<Market> | null;

  @MoneyColumn()
  initialAmount: number;

  @MoneyColumn()
  balance: number;

  @Column({ type: 'int', nullable: true })
  purchasedBy: number | null;

  @Column({ type: 'int', nullable: true })
  ownerId: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: Relation<User> | null;

  @StatusColumn('active', 20)
  status: string;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @CreatedAt()
  createdAt: Date;
}
