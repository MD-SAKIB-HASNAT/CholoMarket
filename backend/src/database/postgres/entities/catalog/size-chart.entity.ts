import { IdColumn } from 'src/database/postgres/columns';
import { Category } from 'src/database/postgres/entities/catalog/category.entity';
import { Shop } from 'src/database/postgres/entities/shop/shop.entity';
import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';

/** Size charts reduce fashion returns. Shop-specific or category-wide (shopId null). */
@Entity('size_charts')
export class SizeChart {
  @IdColumn()
  id: number;

  @Column({ type: 'int' })
  categoryId: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Relation<Category>;

  @Column({ type: 'int', nullable: true })
  shopId: number | null;

  @ManyToOne(() => Shop, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop: Relation<Shop> | null;

  @Column({ type: 'text' })
  name: string;

  /** {"columns":["Size","Chest"],"rows":[["M","38"]]} */
  @Column({ type: 'jsonb' })
  chart: { columns: string[]; rows: string[][] };
}
