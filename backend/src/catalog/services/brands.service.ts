import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { BrandInputDto, BrandQueryDto } from 'src/catalog/dto/brands.dto';
import { CategoriesService } from 'src/catalog/services/categories.service';
import { slugify } from 'src/common/helper/util';
import {
  inOrder,
  keysetIds,
  toCursorPage,
  type CursorPage,
} from 'src/common/pagination';
import { Brand } from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { In } from 'typeorm';

export type BrandRow = Brand & { productCount: number };

@Injectable()
export class BrandsService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly categories: CategoriesService,
  ) {}

  /** A–Z. `inUseOnly` keeps just brands with active products (what shoppers pick from) unless `includeUnused` is asked for. */
  async list(
    q: BrandQueryDto,
    inUseOnly: boolean,
  ): Promise<CursorPage<BrandRow>> {
    const qb = this.postgresService.brands.createQueryBuilder('b');
    if (q.q)
      qb.andWhere('b.name ILIKE :like', {
        like: `%${q.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`,
      });

    const inCategory = q.categoryId
      ? await this.categories.withDescendants(q.categoryId)
      : null;
    if ((inUseOnly && !q.includeUnused) || inCategory) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM products p WHERE p.brand_id = b.id AND p.status = 'active' AND p.deleted_at IS NULL${inCategory ? ' AND p.category_id IN (:...inCategory)' : ''})`,
        { inCategory },
      );
    }

    const page = await keysetIds(qb, {
      idExpr: 'b.id',
      keys: [{ expr: 'b.name', dir: 'ASC', type: 'text' }],
      page: q,
    });
    const found = await this.postgresService.brands.find({
      where: { id: In(page.ids) },
    });
    const counts = await this.productCounts(page.ids);
    return toCursorPage(
      inOrder(page.ids, found).map((b) => ({
        ...b,
        productCount: counts.get(b.id) ?? 0,
      })),
      page,
    );
  }

  async create(dto: BrandInputDto): Promise<Brand> {
    const slug = slugify(dto.slug || dto.name);
    if (await this.postgresService.brands.exists({ where: { slug } }))
      throw new BadRequestException('A brand with that name already exists.');
    return this.postgresService.brands.save({
      name: dto.name.trim(),
      slug,
      logoUrl: dto.logoUrl ?? null,
    });
  }

  async update(id: number, dto: Partial<BrandInputDto>): Promise<Brand> {
    const brand = await this.postgresService.brands.findOneBy({ id });
    if (!brand) throw new NotFoundException('Brand not found');
    const slug = dto.slug ? slugify(dto.slug) : brand.slug;
    if (
      slug !== brand.slug &&
      (await this.postgresService.brands.exists({ where: { slug } }))
    )
      throw new BadRequestException('That slug is taken.');
    return this.postgresService.brands.save({
      ...brand,
      name: dto.name?.trim() ?? brand.name,
      slug,
      logoUrl: dto.logoUrl === undefined ? brand.logoUrl : dto.logoUrl,
    });
  }

  async remove(id: number): Promise<{ deleted: true }> {
    const used = await this.postgresService.products.count({
      where: { brandId: id },
    });
    if (used)
      throw new BadRequestException(
        `${used} product${used > 1 ? 's use' : ' uses'} this brand. Change ${used > 1 ? 'them' : 'it'} first.`,
      );
    await this.postgresService.brands.delete(id);
    return { deleted: true };
  }

  private async productCounts(
    brandIds: number[],
  ): Promise<Map<number, number>> {
    if (!brandIds.length) return new Map();
    const rows = await this.postgresService.products
      .createQueryBuilder('p')
      .select('p.brand_id', 'brandId')
      .addSelect('count(*)::int', 'count')
      .where('p.brand_id IN (:...brandIds)', { brandIds })
      .andWhere("p.status = 'active'")
      .andWhere('p.deleted_at IS NULL')
      .groupBy('p.brand_id')
      .getRawMany<{ brandId: number; count: number }>();
    return new Map(rows.map((r) => [r.brandId, r.count]));
  }
}
