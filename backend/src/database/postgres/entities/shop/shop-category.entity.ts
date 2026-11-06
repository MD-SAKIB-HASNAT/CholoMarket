import { Category } from 'src/database/postgres/entities/catalog/category.entity';
import { Shop } from 'src/database/postgres/entities/shop/shop.entity';
import {
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';

/** A shop can sell in several categories ("shops by category" filter). */
@Entity('shop_categories')
export class ShopCategory {
  @PrimaryColumn({ type: 'int' })
  shopId: number;

  @Index()
  @PrimaryColumn({ type: 'int' })
  categoryId: number;

  @ManyToOne(() => Shop, (s) => s.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop: Relation<Shop>;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: Relation<Category>;
}
