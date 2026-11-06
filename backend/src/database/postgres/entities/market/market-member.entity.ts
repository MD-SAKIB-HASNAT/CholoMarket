import { MARKET_ROLES, inList, type MarketRole } from 'src/database/enums';
import { CreatedAt } from 'src/database/postgres/columns';
import { Market } from 'src/database/postgres/entities/market/market.entity';
import { User } from 'src/database/postgres/entities/user/user.entity';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';

/** Mall/market management (the "market admin" role). */
@Entity('market_members')
@Check('CHK_market_members_role', inList('role', MARKET_ROLES))
export class MarketMember {
  @PrimaryColumn({ type: 'int' })
  marketId: number;

  @Index()
  @PrimaryColumn({ type: 'int' })
  userId: number;

  @ManyToOne(() => Market, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'market_id' })
  market: Relation<Market>;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ type: 'varchar', length: 20 })
  role: MarketRole;

  @CreatedAt()
  createdAt: Date;
}
