import { CreatedAt, IdColumn } from 'src/database/postgres/columns';
import { MarketFloor } from 'src/database/postgres/entities/market/market-floor.entity';
import { Market } from 'src/database/postgres/entities/market/market.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

/** Mall pickup desks (Phase 1), which become rider hubs (Phase 2). */
@Entity('pickup_points')
export class PickupPoint {
  @IdColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  marketId: number;

  @ManyToOne(() => Market, (m) => m.pickupPoints)
  @JoinColumn({ name: 'market_id' })
  market: Relation<Market>;

  @Column({ type: 'int', nullable: true })
  floorId: number | null;

  @ManyToOne(() => MarketFloor)
  @JoinColumn({ name: 'floor_id' })
  floor: Relation<MarketFloor>;

  @Column({ type: 'text' })
  nameEn: string;

  @Column({ type: 'text', nullable: true })
  nameBn: string | null;

  @Column({ type: 'text', nullable: true })
  instructions: string | null;

  @Column({ type: 'time', nullable: true })
  opensAt: string | null;

  @Column({ type: 'time', nullable: true })
  closesAt: string | null;

  /** [PHASE 2] rider hub. */
  @Column({ type: 'boolean', default: false })
  isHub: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreatedAt()
  createdAt: Date;
}
