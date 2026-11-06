import { CreatedAt } from 'src/database/postgres/columns';
import { Product } from 'src/database/postgres/entities/product/product.entity';
import { User } from 'src/database/postgres/entities/user/user.entity';
import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';

@Entity('wishlist_items')
export class WishlistItem {
  @PrimaryColumn({ type: 'int' })
  userId: number;

  @PrimaryColumn({ type: 'int' })
  productId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product>;

  @CreatedAt()
  createdAt: Date;
}
