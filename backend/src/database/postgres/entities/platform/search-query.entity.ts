import { SEARCH_SCOPES, inList } from 'src/database/enums';
import { BigIdColumn, CreatedAt } from 'src/database/postgres/columns';
import { Market } from 'src/database/postgres/entities/market/market.entity';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

/** Feeds "smart Bangla search" later: what people type and whether they found it. */
@Entity('search_queries')
@Check('CHK_search_queries_scope', inList('scope', SEARCH_SCOPES))
export class SearchQuery {
  @BigIdColumn()
  id: string;

  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @Column({ type: 'text' })
  query: string;

  @Column({ type: 'varchar', length: 10 })
  scope: string;

  @Column({ type: 'int', nullable: true })
  marketId: number | null;

  @ManyToOne(() => Market, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'market_id' })
  market: Relation<Market> | null;

  @Column({ type: 'int' })
  resultsCount: number;

  @Index()
  @CreatedAt()
  createdAt: Date;
}
