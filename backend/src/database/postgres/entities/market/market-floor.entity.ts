import { IdColumn } from 'src/database/postgres/columns';
import { Market } from 'src/database/postgres/entities/market/market.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Unique,
  type Relation,
} from 'typeorm';

/** Floors power the "walk through the mall" experience. */
@Entity('market_floors')
@Unique(['marketId', 'level'])
export class MarketFloor {
  @IdColumn()
  id: number;

  @Column({ type: 'int' })
  marketId: number;

  @ManyToOne(() => Market, (m) => m.floors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'market_id' })
  market: Relation<Market>;

  /** -1 basement, 0 ground, 1, 2 ... */
  @Column({ type: 'smallint' })
  level: number;

  @Column({ type: 'text' })
  nameEn: string;

  @Column({ type: 'text', nullable: true })
  nameBn: string | null;

  @Column({ type: 'text', nullable: true })
  mapImageUrl: string | null;
}
