import {
  INVENTORY_REASONS,
  inList,
  type InventoryReason,
} from 'src/database/enums';
import { BigIdColumn, CreatedAt } from 'src/database/postgres/columns';
import { ProductVariant } from 'src/database/postgres/entities/product/product-variant.entity';
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

/** Append-only stock ledger. Every change to stock_qty / reserved_qty writes a row. */
@Entity('inventory_movements')
@Check('CHK_inventory_movements_reason', inList('reason', INVENTORY_REASONS))
@Index(['variantId', 'createdAt'])
export class InventoryMovement {
  @BigIdColumn()
  id: string;

  @Column({ type: 'int' })
  variantId: number;

  @ManyToOne(() => ProductVariant)
  @JoinColumn({ name: 'variant_id' })
  variant: Relation<ProductVariant>;

  @Column({ type: 'int', default: 0 })
  stockChange: number;

  @Column({ type: 'int', default: 0 })
  reservedChange: number;

  @Column({ type: 'varchar', length: 20 })
  reason: InventoryReason;

  @Column({ type: 'int', nullable: true })
  orderItemId: number | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'int', nullable: true })
  createdBy: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: Relation<User> | null;

  @CreatedAt()
  createdAt: Date;
}
