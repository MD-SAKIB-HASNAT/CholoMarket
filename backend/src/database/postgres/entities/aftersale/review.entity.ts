import { REVIEW_STATUSES, inList } from 'src/database/enums';
import {
  CreatedAt,
  IdColumn,
  StatusColumn,
  Timestamp,
} from 'src/database/postgres/columns';
import { ShopOrder } from 'src/database/postgres/entities/order/shop-order.entity';
import { Product } from 'src/database/postgres/entities/product/product.entity';
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

/**
 * Shop review (productId null) or product review. Only from completed purchases:
 * shopOrderId is required, one review per (shop order, product). The unique
 * index on (shop_order_id, coalesce(product_id, 0)) is in the search-indexes migration.
 */
@Entity('reviews')
@Check('CHK_reviews_rating', '"rating" BETWEEN 1 AND 5')
@Check('CHK_reviews_status', inList('status', REVIEW_STATUSES))
@Index('UQ_reviews_one_per_target', { synchronize: false })
@Index(['shopId', 'createdAt'])
export class Review {
  @IdColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ type: 'int' })
  shopId: number;

  @ManyToOne(() => Shop)
  @JoinColumn({ name: 'shop_id' })
  shop: Relation<Shop>;

  @Index()
  @Column({ type: 'int', nullable: true })
  productId: number | null;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product> | null;

  @Column({ type: 'int' })
  shopOrderId: number;

  @ManyToOne(() => ShopOrder)
  @JoinColumn({ name: 'shop_order_id' })
  shopOrder: Relation<ShopOrder>;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'text', array: true, default: '{}' })
  photoUrls: string[];

  @Column({ type: 'text', nullable: true })
  shopReply: string | null;

  @Timestamp()
  shopRepliedAt: Date | null;

  @StatusColumn('published', 15)
  status: string;

  @CreatedAt()
  createdAt: Date;
}
