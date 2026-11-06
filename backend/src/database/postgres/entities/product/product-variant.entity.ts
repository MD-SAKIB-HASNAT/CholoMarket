import {
  CreatedAt,
  IdColumn,
  MoneyColumn,
  UpdatedAt,
} from 'src/database/postgres/columns';
import { Product } from 'src/database/postgres/entities/product/product.entity';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

/**
 * stock_qty    = what the shop physically has
 * reserved_qty = held for online orders not yet collected
 * available_qty (generated) = what customers can still buy
 */
@Entity('product_variants')
@Check('CHK_variants_price', '"price" >= 0')
@Check('CHK_variants_stock', '"stock_qty" >= 0')
@Check(
  'CHK_variants_reserved',
  '"reserved_qty" >= 0 AND "reserved_qty" <= "stock_qty"',
)
@Index('IDX_product_variants_attributes', { synchronize: false })
export class ProductVariant {
  @IdColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  productId: number;

  @ManyToOne(() => Product, (p) => p.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product>;

  @Column({ type: 'text', nullable: true })
  sku: string | null;

  @Column({ type: 'text', nullable: true })
  barcode: string | null;

  /** {"size":"M","color":"Red"} */
  @Column({ type: 'jsonb', default: {} })
  attributes: Record<string, string>;

  @MoneyColumn()
  price: number;

  /** "Was" price, shown struck through. */
  @MoneyColumn({ nullable: true })
  compareAtPrice: number | null;

  /** Hidden floor for bargaining: offers below this are auto-rejected. */
  @MoneyColumn({ nullable: true })
  minOfferPrice: number | null;

  @Column({ type: 'int', default: 0 })
  stockQty: number;

  @Column({ type: 'int', default: 0 })
  reservedQty: number;

  @Column({
    type: 'int',
    generatedType: 'STORED',
    asExpression: '"stock_qty" - "reserved_qty"',
    insert: false,
    update: false,
  })
  availableQty: number;

  @Column({ type: 'int', default: 2 })
  lowStockThreshold: number;

  /** Lets the app show "stock updated 2h ago" and flag stale shops. */
  @Column({ type: 'timestamptz', default: () => 'now()' })
  stockUpdatedAt: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreatedAt()
  createdAt: Date;

  @UpdatedAt()
  updatedAt: Date;
}
