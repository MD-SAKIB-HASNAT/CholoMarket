import { IdColumn } from 'src/database/postgres/columns';
import { ProductVariant } from 'src/database/postgres/entities/product/product-variant.entity';
import { Product } from 'src/database/postgres/entities/product/product.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

@Entity('product_images')
@Index(['productId', 'sortOrder'])
export class ProductImage {
  @IdColumn()
  id: number;

  @Column({ type: 'int' })
  productId: number;

  @ManyToOne(() => Product, (p) => p.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product>;

  @Column({ type: 'int', nullable: true })
  variantId: number | null;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variant_id' })
  variant: Relation<ProductVariant> | null;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'smallint', default: 0 })
  sortOrder: number;
}
