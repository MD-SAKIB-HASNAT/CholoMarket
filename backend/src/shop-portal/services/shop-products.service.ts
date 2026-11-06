import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { money, slugify } from 'src/common/helper/util';
import {
  inOrder,
  keysetIds,
  toCursorPage,
  type CursorQueryDto,
} from 'src/common/pagination';
import {
  AuditLog,
  Category,
  InventoryMovement,
  Product,
  ProductImage,
  ProductVariant,
  ShopSubscription,
} from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { InventoryService } from 'src/orders/services/inventory.service';
import type {
  ProductInputDto,
  ProductListQueryDto,
  StockUpdateDto,
} from 'src/shop-portal/dto/shop-products.dto';
import { In, Not, type EntityManager } from 'typeorm';

@Injectable()
export class ShopProductsService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly inventory: InventoryService,
  ) {}

  /** The shop's own catalogue, most recently edited first. */
  async list(shopId: number, q: ProductListQueryDto) {
    const qb = this.postgresService.products
      .createQueryBuilder('p')
      .where('p.shop_id = :shopId', { shopId })
      .andWhere('p.deleted_at IS NULL');
    if (q.status === 'low_stock') {
      qb.andWhere(
        "p.status = 'active' AND EXISTS (SELECT 1 FROM product_variants lv WHERE lv.product_id = p.id AND lv.is_active AND lv.available_qty <= lv.low_stock_threshold)",
      );
    } else if (q.status)
      qb.andWhere('p.status = :status', { status: q.status });
    else qb.andWhere("p.status <> 'archived'");
    if (q.q) {
      // By name (English or Bangla) or by any variant's SKU.
      qb.andWhere(
        "((p.name_en || ' ' || coalesce(p.name_bn, '')) ILIKE :like OR EXISTS (SELECT 1 FROM product_variants sv WHERE sv.product_id = p.id AND sv.sku ILIKE :like))",
        { like: `%${q.q}%` },
      );
    }
    const page = await keysetIds(qb, {
      idExpr: 'p.id',
      keys: [{ expr: 'p.updated_at', dir: 'DESC', type: 'timestamptz' }],
      tieDir: 'DESC',
      page: q,
    });
    const found = await this.postgresService.products.find({
      where: { id: In(page.ids) },
      relations: { variants: true, images: true, category: true },
      order: { variants: { id: 'ASC' }, images: { sortOrder: 'ASC' } },
    });
    return toCursorPage(inOrder(page.ids, found), page);
  }

  async get(shopId: number, productId: number) {
    const product = await this.postgresService.products.findOne({
      where: { id: productId, shopId },
      relations: { variants: true, images: true, category: true },
      order: { variants: { id: 'ASC' }, images: { sortOrder: 'ASC' } },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(shopId: number, userId: number, dto: ProductInputDto) {
    await this.assertPlanLimit(shopId);
    const id = await this.postgresService.dataSource.transaction(async (m) => {
      await this.assertCategory(m, dto.categoryId);
      const product = await m.save(Product, {
        shopId,
        categoryId: dto.categoryId,
        brandId: dto.brandId ?? null,
        slug: await this.uniqueSlug(m, shopId, dto.nameEn),
        nameEn: dto.nameEn.trim(),
        nameBn: dto.nameBn?.trim() || null,
        description: dto.description ?? null,
        condition: dto.condition ?? 'new',
        warrantyType: dto.warrantyType ?? 'none',
        warrantyMonths: dto.warrantyMonths ?? null,
        isNegotiable: dto.isNegotiable ?? false,
        status: dto.status ?? 'active',
        createdBy: userId,
      });
      await this.saveImages(m, product.id, dto.images ?? []);
      for (const v of dto.variants)
        await this.createVariant(m, product.id, v, userId);
      await this.refreshMinPrice(m, product.id);
      return product.id;
    });
    return this.get(shopId, id);
  }

  async update(
    shopId: number,
    productId: number,
    userId: number,
    dto: ProductInputDto,
  ) {
    await this.postgresService.dataSource.transaction(async (m) => {
      const product = await m.findOne(Product, {
        where: { id: productId, shopId },
        relations: { variants: true },
      });
      if (!product) throw new NotFoundException('Product not found');
      await this.assertCategory(m, dto.categoryId);
      Object.assign(product, {
        categoryId: dto.categoryId,
        brandId: dto.brandId ?? null,
        nameEn: dto.nameEn.trim(),
        nameBn: dto.nameBn?.trim() || null,
        description: dto.description ?? null,
        condition: dto.condition ?? product.condition,
        warrantyType: dto.warrantyType ?? product.warrantyType,
        warrantyMonths: dto.warrantyMonths ?? null,
        isNegotiable: dto.isNegotiable ?? product.isNegotiable,
        status: dto.status ?? product.status,
      });
      const { variants: existing, ...fields } = product;
      await m.save(Product, fields);
      if (dto.images) {
        await m.delete(ProductImage, { productId });
        await this.saveImages(m, productId, dto.images);
      }

      const keep = new Set<number>();
      for (const input of dto.variants) {
        if (input.id) {
          const variant = existing.find((v) => v.id === input.id);
          if (!variant)
            throw new BadRequestException(
              `Variant ${input.id} does not belong to this product.`,
            );
          keep.add(variant.id);
          if (variant.price !== input.price) {
            await m.insert(AuditLog, {
              actorId: userId,
              action: 'variant.price',
              entityType: 'product_variant',
              entityId: variant.id,
              changes: { price: [variant.price, input.price] },
            });
          }
          await m.update(ProductVariant, variant.id, {
            sku: input.sku ?? null,
            attributes: input.attributes ?? {},
            price: input.price,
            compareAtPrice: input.compareAtPrice ?? null,
            minOfferPrice: input.minOfferPrice ?? null,
            isActive: input.isActive ?? true,
          });
        } else {
          const created = await this.createVariant(m, productId, input, userId);
          keep.add(created.id);
        }
      }
      // Variants removed from the form are deactivated (orders may still reference them).
      if (existing.length) {
        await m.update(
          ProductVariant,
          { productId, id: Not(In([...keep])) },
          { isActive: false },
        );
      }
      await this.refreshMinPrice(m, productId);
    });
    return this.get(shopId, productId);
  }

  async setStatus(
    shopId: number,
    productId: number,
    status: 'active' | 'hidden' | 'archived',
  ) {
    const res = await this.postgresService.products.update(
      { id: productId, shopId },
      { status },
    );
    if (!res.affected) throw new NotFoundException();
    return this.get(shopId, productId);
  }

  /** One-tap stock buttons in the shop app. */
  async updateStock(
    shopId: number,
    variantId: number,
    userId: number,
    dto: StockUpdateDto,
  ) {
    const variant = await this.postgresService.productVariants.findOne({
      where: { id: variantId },
      relations: { product: true },
    });
    if (!variant || variant.product.shopId !== shopId)
      throw new NotFoundException('Variant not found');
    const change =
      dto.mode === 'set' ? dto.quantity - variant.stockQty : dto.quantity;
    if (dto.mode === 'set' && dto.quantity < 0)
      throw new BadRequestException('Stock cannot be negative.');
    const reason =
      dto.reason ??
      (dto.mode === 'set'
        ? 'manual_adjust'
        : change > 0
          ? 'restock'
          : 'offline_sale');
    await this.postgresService.dataSource.transaction((m) =>
      this.inventory.adjust(m, variantId, change, reason, userId, dto.note),
    );
    return this.postgresService.productVariants.findOneOrFail({
      where: { id: variantId },
    });
  }

  /** A variant's stock movements, newest first. */
  async stockHistory(shopId: number, variantId: number, q: CursorQueryDto) {
    const variant = await this.postgresService.productVariants.findOne({
      where: { id: variantId },
      relations: { product: true },
    });
    if (!variant || variant.product.shopId !== shopId)
      throw new NotFoundException();
    const movements =
      this.postgresService.dataSource.getRepository(InventoryMovement);
    const qb = movements
      .createQueryBuilder('m')
      .where('m.variant_id = :variantId', { variantId });
    const page = await keysetIds(qb, {
      idExpr: 'm.id',
      keys: [{ expr: 'm.created_at', dir: 'DESC', type: 'timestamptz' }],
      tieDir: 'DESC',
      idType: 'bigint',
      page: q,
    });
    // Movement ids are bigints (strings), so put the rows back in page order by number.
    const found = await movements.find({
      where: { id: In(page.ids.map(String)) },
      relations: { creator: true },
    });
    const byId = new Map(found.map((m) => [Number(m.id), m]));
    return toCursorPage(
      page.ids.flatMap((id) => byId.get(id) ?? []),
      page,
    );
  }

  // ------------------------------------------------------------ helpers (also used by CSV import)

  async createVariant(
    m: EntityManager,
    productId: number,
    input: {
      sku?: string;
      attributes?: Record<string, string>;
      price: number;
      compareAtPrice?: number | null;
      minOfferPrice?: number | null;
      stockQty?: number;
      isActive?: boolean;
    },
    userId: number,
  ) {
    const variant = await m.save(ProductVariant, {
      productId,
      sku: input.sku ?? null,
      attributes: input.attributes ?? {},
      price: money(input.price),
      compareAtPrice: input.compareAtPrice ?? null,
      minOfferPrice: input.minOfferPrice ?? null,
      stockQty: input.stockQty ?? 0,
      isActive: input.isActive ?? true,
    });
    if (variant.stockQty > 0) {
      await m.insert(InventoryMovement, {
        variantId: variant.id,
        stockChange: variant.stockQty,
        reason: 'restock',
        note: 'Opening stock',
        createdBy: userId,
      });
    }
    return variant;
  }

  async refreshMinPrice(m: EntityManager, productId: number) {
    await m.query(
      `UPDATE products SET min_price = (SELECT min(price) FROM product_variants WHERE product_id = $1 AND is_active) WHERE id = $1`,
      [productId],
    );
  }

  async uniqueSlug(m: EntityManager, shopId: number, name: string) {
    const base = slugify(name).slice(0, 60);
    let slug = base;
    for (
      let i = 2;
      await m.exists(Product, { where: { shopId, slug }, withDeleted: true });
      i++
    )
      slug = `${base}-${i}`;
    return slug;
  }

  private async saveImages(
    m: EntityManager,
    productId: number,
    urls: string[],
  ) {
    if (urls.length)
      await m.insert(
        ProductImage,
        urls.map((url, i) => ({ productId, url, sortOrder: i })),
      );
  }

  private async assertCategory(m: EntityManager, categoryId: number) {
    if (
      !(await m.exists(Category, { where: { id: categoryId, isActive: true } }))
    ) {
      throw new BadRequestException('Choose a valid category.');
    }
  }

  private async assertPlanLimit(shopId: number) {
    const sub = await this.postgresService.dataSource
      .getRepository(ShopSubscription)
      .findOne({
        where: { shopId, status: In(['trial', 'active', 'past_due']) },
        relations: { plan: true },
      });
    const limit = sub?.plan.maxProducts;
    if (limit === null || limit === undefined) return;
    const count = await this.postgresService.products.count({
      where: { shopId, status: Not('archived') },
    });
    if (count >= limit) {
      throw new ForbiddenException(
        `Your ${sub!.plan.nameEn} plan allows ${limit} products. Upgrade to add more.`,
      );
    }
  }
}
