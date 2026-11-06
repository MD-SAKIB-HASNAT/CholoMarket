import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { parse } from 'csv-parse/sync';
import { readFile } from 'node:fs/promises';
import {
  Category,
  ImportJob,
  Product,
  ProductVariant,
} from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { InventoryService } from 'src/orders/services/inventory.service';
import { QUEUES, type ImportJobData } from 'src/platform/helpers/queues';
import { ShopProductsService } from 'src/shop-portal/services/shop-products.service';

/**
 * Bulk product upload (the onboarding team photographs a shop and uploads a sheet).
 * Columns: name_en, name_bn, category_slug, price, stock, sku, compare_at_price,
 *          size, color, description, negotiable
 * Rows whose SKU already exists in the shop update price/stock instead of creating.
 */
export const IMPORT_COLUMNS = [
  'name_en',
  'name_bn',
  'category_slug',
  'price',
  'stock',
  'sku',
  'compare_at_price',
  'size',
  'color',
  'description',
  'negotiable',
];

@Processor(QUEUES.imports)
export class ImportsProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportsProcessor.name);

  constructor(
    private readonly postgresService: PostgresService,
    private readonly products: ShopProductsService,
    private readonly inventory: InventoryService,
  ) {
    super();
  }

  async process(job: Job<ImportJobData>) {
    const jobs = this.postgresService.dataSource.getRepository(ImportJob);
    const record = await jobs.findOneByOrFail({ id: job.data.importJobId });
    await jobs.update(record.id, { status: 'processing' });

    let rows: Record<string, string>[];
    try {
      rows = parse(await readFile(job.data.filePath), {
        columns: (h: string[]) => h.map((c) => c.trim().toLowerCase()),
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });
    } catch (err) {
      await jobs.update(record.id, {
        status: 'failed',
        errors: [
          { row: 0, error: `Could not read CSV: ${(err as Error).message}` },
        ],
        finishedAt: new Date(),
      });
      return;
    }

    const categories = new Map(
      (
        await this.postgresService.dataSource.getRepository(Category).find()
      ).map((c) => [c.slug, c.id]),
    );
    const errors: { row: number; error: string }[] = [];
    let created = 0;
    let updated = 0;

    for (const [index, row] of rows.entries()) {
      const rowNo = index + 2; // header is row 1
      try {
        const price = Number(row.price);
        const stock = row.stock ? Number.parseInt(row.stock, 10) : 0;
        if (!row.name_en) throw new Error('name_en is required');
        if (!Number.isFinite(price) || price < 0)
          throw new Error('price must be a number');
        if (!Number.isInteger(stock) || stock < 0)
          throw new Error('stock must be a whole number');
        const categoryId = categories.get(row.category_slug);
        if (!categoryId)
          throw new Error(`unknown category_slug "${row.category_slug}"`);
        const attributes: Record<string, string> = {};
        if (row.size) attributes.size = row.size;
        if (row.color) attributes.color = row.color;

        await this.postgresService.dataSource.transaction(async (m) => {
          const existing = row.sku
            ? await m
                .createQueryBuilder(ProductVariant, 'v')
                .innerJoin('v.product', 'p')
                .where('p.shop_id = :shopId AND v.sku = :sku', {
                  shopId: record.shopId,
                  sku: row.sku,
                })
                .getOne()
            : null;
          if (existing) {
            await m.update(ProductVariant, existing.id, {
              price,
              compareAtPrice: row.compare_at_price
                ? Number(row.compare_at_price)
                : null,
            });
            if (stock !== existing.stockQty)
              await this.inventory.adjust(
                m,
                existing.id,
                stock - existing.stockQty,
                'import',
                record.createdBy,
                `Import #${record.id}`,
              );
            await this.products.refreshMinPrice(m, existing.productId);
            updated++;
            return;
          }
          const product = await m.save(Product, {
            shopId: record.shopId,
            categoryId,
            slug: await this.products.uniqueSlug(m, record.shopId, row.name_en),
            nameEn: row.name_en,
            nameBn: row.name_bn || null,
            description: row.description || null,
            isNegotiable: ['yes', 'true', '1'].includes(
              (row.negotiable ?? '').toLowerCase(),
            ),
            status: 'active',
            createdBy: record.createdBy,
          });
          await this.products.createVariant(
            m,
            product.id,
            {
              sku: row.sku || undefined,
              attributes,
              price,
              stockQty: stock,
              compareAtPrice: row.compare_at_price
                ? Number(row.compare_at_price)
                : null,
            },
            record.createdBy,
          );
          await this.products.refreshMinPrice(m, product.id);
          created++;
        });
      } catch (err) {
        errors.push({ row: rowNo, error: (err as Error).message });
      }
    }

    await jobs.update(record.id, {
      status: 'completed',
      totalRows: rows.length,
      createdCount: created,
      updatedCount: updated,
      failedCount: errors.length,
      errors: errors.slice(0, 200),
      finishedAt: new Date(),
    });
    this.logger.log(
      `Import #${record.id}: ${created} created, ${updated} updated, ${errors.length} failed`,
    );
    return { created, updated, failed: errors.length };
  }
}
