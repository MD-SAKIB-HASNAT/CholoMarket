import {
  VERIFICATION_KINDS,
  VERIFICATION_STATUSES,
  inList,
  type VerificationKind,
  type VerificationStatus,
} from 'src/database/enums';
import {
  CreatedAt,
  IdColumn,
  StatusColumn,
  Timestamp,
} from 'src/database/postgres/columns';
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

@Entity('shop_verifications')
@Check('CHK_shop_verifications_kind', inList('kind', VERIFICATION_KINDS))
@Check('CHK_shop_verifications_status', inList('status', VERIFICATION_STATUSES))
@Index(['shopId', 'kind'])
export class ShopVerification {
  @IdColumn()
  id: number;

  @Column({ type: 'int' })
  shopId: number;

  @ManyToOne(() => Shop, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop: Relation<Shop>;

  @Column({ type: 'varchar', length: 20 })
  kind: VerificationKind;

  @Column({ type: 'text', nullable: true })
  documentNumber: string | null;

  /** Private storage in production. */
  @Column({ type: 'text', nullable: true })
  documentUrl: string | null;

  @StatusColumn('pending', 20)
  status: VerificationStatus;

  @Column({ type: 'date', nullable: true })
  expiresOn: string | null;

  @Column({ type: 'int', nullable: true })
  reviewedBy: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: Relation<User> | null;

  @Timestamp()
  reviewedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreatedAt()
  createdAt: Date;
}
