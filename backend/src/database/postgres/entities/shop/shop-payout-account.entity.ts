import { PAYOUT_METHODS, inList, type PayoutMethod } from 'src/database/enums';
import { CreatedAt, IdColumn, Timestamp } from 'src/database/postgres/columns';
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

/** Where the platform sends the shop's money. Encrypt accountNumber at rest in production. */
@Entity('shop_payout_accounts')
@Check('CHK_shop_payout_accounts_method', inList('method', PAYOUT_METHODS))
@Index('UQ_shop_payout_accounts_one_default', ['shopId'], {
  unique: true,
  where: '"is_default"',
})
export class ShopPayoutAccount {
  @IdColumn()
  id: number;

  @Column({ type: 'int' })
  shopId: number;

  @ManyToOne(() => Shop, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop: Relation<Shop>;

  @Column({ type: 'varchar', length: 10 })
  method: PayoutMethod;

  @Column({ type: 'text' })
  accountName: string;

  @Column({ type: 'text' })
  accountNumber: string;

  @Column({ type: 'text', nullable: true })
  bankName: string | null;

  @Column({ type: 'text', nullable: true })
  branchName: string | null;

  @Column({ type: 'text', nullable: true })
  routingNumber: string | null;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Timestamp()
  verifiedAt: Date | null;

  @CreatedAt()
  createdAt: Date;
}
