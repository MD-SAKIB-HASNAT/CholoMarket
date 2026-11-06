import { IMPORT_STATUSES, inList, type ImportStatus } from 'src/database/enums';
import {
  CreatedAt,
  IdColumn,
  StatusColumn,
  Timestamp,
} from 'src/database/postgres/columns';
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

/** Bulk product CSV imports processed by the Bull "imports" queue. */
@Entity('import_jobs')
@Check('CHK_import_jobs_status', inList('status', IMPORT_STATUSES))
@Index(['shopId', 'createdAt'])
export class ImportJob {
  @IdColumn()
  id: number;

  @Column({ type: 'int' })
  shopId: number;

  @ManyToOne(() => Shop)
  @JoinColumn({ name: 'shop_id' })
  shop: Relation<Shop>;

  @Column({ type: 'int' })
  createdBy: number;

  @Column({ type: 'text' })
  fileName: string;

  @StatusColumn('queued', 15)
  status: ImportStatus;

  @Column({ type: 'int', default: 0 })
  totalRows: number;

  @Column({ type: 'int', default: 0 })
  createdCount: number;

  @Column({ type: 'int', default: 0 })
  updatedCount: number;

  @Column({ type: 'int', default: 0 })
  failedCount: number;

  /** [{row: 4, error: "price is required"}] */
  @Column({ type: 'jsonb', default: [] })
  errors: { row: number; error: string }[];

  @CreatedAt()
  createdAt: Date;

  @Timestamp()
  finishedAt: Date | null;
}
