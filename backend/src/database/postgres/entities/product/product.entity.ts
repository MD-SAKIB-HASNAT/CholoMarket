import {
  PRODUCT_CONDITIONS,
  PRODUCT_STATUSES,
  WARRANTY_TYPES,
  inList,
  type ProductCondition,
  type ProductStatus,
  type WarrantyType,
} from 'src/database/enums';
import {
  CreatedAt,
  IdColumn,
  MoneyColumn,
  StatusColumn,
  UpdatedAt,
  numericTransformer,
} from 'src/database/postgres/columns';
import { Brand } from 'src/database/postgres/entities/catalog/brand.entity';
import { Category } from 'src/database/postgres/entities/catalog/category.entity';
import { SizeChart } from 'src/database/postgres/entities/catalog/size-chart.entity';
import { ProductImage } from 'src/database/postgres/entities/product/product-image.entity';
import { ProductVariant } from 'src/database/postgres/entities/product/product-variant.entity';
import { Shop } from 'src/database/postgres/entities/shop/shop.entity';
import { User } from 'src/database/postgres/entities/user/user.entity';
import {
  Check,
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
  type Relation,
} from 'typeorm';

/**
 * A product belongs to exactly one shop. Price and stock live on variants
 * (size / colour / storage). Trigram + full-text indexes are added in the
 * search-indexes migration.
 */
@Entity('products')
@Unique(['shopId', 'slug'])
@Check('CHK_products_status', inList('status', PRODUCT_STATUSES))
@Check('CHK_products_condition', inList('condition', PRODUCT_CONDITIONS))
@Check('CHK_products_warranty', inList('warranty_type', WARRANTY_TYPES))
@Index('IDX_products_shop_status', ['shopId', 'status'])
@Index('IDX_products_category_status', ['categoryId', 'status'])
@Index('IDX_products_search_vector', { synchronize: false })
export class Product {
  @IdColumn()
  id: number;

  @Column({ type: 'int' })
  shopId: number;

  @ManyToOne(() => Shop)
  @JoinColumn({ name: 'shop_id' })
  shop: Relation<Shop>;

  @Column({ type: 'int' })
  categoryId: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Relation<Category>;

  @Column({ type: 'int', nullable: true })
  brandId: number | null;

  @ManyToOne(() => Brand)
  @JoinColumn({ name: 'brand_id' })
  brand: Relation<Brand> | null;

  @Column({ type: 'int', nullable: true })
  sizeChartId: number | null;

  @ManyToOne(() => SizeChart)
  @JoinColumn({ name: 'size_chart_id' })
  sizeChart: Relation<SizeChart> | null;

  @Column({ type: 'text' })
  slug: string;

  @Column({ type: 'text' })
  nameEn: string;

  @Column({ type: 'text', nullable: true })
  nameBn: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @StatusColumn('new', 20)
  condition: ProductCondition;

  @StatusColumn('none', 20)
  warrantyType: WarrantyType;

  @Column({ type: 'smallint', nullable: true })
  warrantyMonths: number | null;

  @Column({ type: 'boolean', default: false })
  isNegotiable: boolean;

  /** Denormalised cheapest active variant price, for listing and sorting. */
  @MoneyColumn({ nullable: true })
  minPrice: number | null;

  @StatusColumn('draft', 20)
  status: ProductStatus;

  @Column({
    type: 'numeric',
    precision: 3,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  ratingAvg: number;

  @Column({ type: 'int', default: 0 })
  ratingCount: number;

  @Column({
    type: 'tsvector',
    generatedType: 'STORED',
    asExpression:
      "to_tsvector('simple', coalesce(name_en, '') || ' ' || coalesce(name_bn, '') || ' ' || coalesce(description, ''))",
    select: false,
    insert: false,
    update: false,
  })
  searchVector: string;

  @Column({ type: 'int', nullable: true })
  createdBy: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: Relation<User> | null;

  @OneToMany(() => ProductVariant, (v) => v.product, {
    cascade: ['insert', 'update'],
  })
  variants: Relation<ProductVariant[]>;

  @OneToMany(() => ProductImage, (i) => i.product, {
    cascade: ['insert', 'update'],
  })
  images: Relation<ProductImage[]>;

  @CreatedAt()
  createdAt: Date;

  @UpdatedAt()
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
