import {
  COURIER_MODES,
  COURIER_PROVIDERS,
  inList,
  type CourierMode,
  type CourierProvider,
} from 'src/database/enums';
import {
  CreatedAt,
  IdColumn,
  Timestamp,
  UpdatedAt,
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

/** A shop's merchant account with a courier. Keys are encrypted at rest in production. */
@Entity('courier_accounts')
@Check('CHK_courier_accounts_provider', inList('provider', COURIER_PROVIDERS))
@Check('CHK_courier_accounts_mode', inList('mode', COURIER_MODES))
@Index('UQ_courier_accounts_one_default', ['shopId', 'provider'], {
  unique: true,
  where: '"is_default"',
})
export class CourierAccount {
  @IdColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  shopId: number;

  @ManyToOne(() => Shop, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop: Relation<Shop>;

  @Column({ type: 'varchar', length: 20 })
  provider: CourierProvider;

  @Column({ type: 'varchar', length: 10, default: 'mock' })
  mode: CourierMode;

  /** e.g. "Steadfast — main account" */
  @Column({ type: 'text' })
  label: string;

  @Column({ type: 'text', nullable: true, select: false })
  apiKey: string | null;

  @Column({ type: 'text', nullable: true, select: false })
  secretKey: string | null;

  /** Last 4 characters of the API key, safe to show in the UI. */
  @Column({ type: 'varchar', length: 8, nullable: true })
  keyHint: string | null;

  @Column({ type: 'boolean', default: true })
  isDefault: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Timestamp()
  lastCheckedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  lastError: string | null;

  @CreatedAt()
  createdAt: Date;

  @UpdatedAt()
  updatedAt: Date;
}
