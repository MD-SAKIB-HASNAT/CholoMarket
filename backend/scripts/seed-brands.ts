// Adds the demo brands and attaches them to products that have no brand yet, without touching anything else.
// Safe to run again. Usage: npm run seed:brands
import { config } from 'dotenv';
import 'reflect-metadata';
import { AppDataSource } from 'src/database/postgres/data-source';
import { BRANDS } from './brand-data';

async function main() {
  config();
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to touch a production database.');
    process.exit(1);
  }

  await AppDataSource.initialize();
  let attached = 0;
  for (const brand of BRANDS) {
    await AppDataSource.query(
      `INSERT INTO brands (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING`,
      [brand.name, brand.slug],
    );
    const [{ id }] = await AppDataSource.query<{ id: number }[]>(
      `SELECT id FROM brands WHERE slug = $1`,
      [brand.slug],
    );
    for (const pattern of brand.products) {
      const [, count] = await AppDataSource.query(
        `UPDATE products SET brand_id = $1 WHERE name_en LIKE $2 AND brand_id IS NULL`,
        [id, pattern],
      );
      attached += count;
    }
  }
  const [counts] = await AppDataSource.query(
    `SELECT (SELECT count(*) FROM brands)::int AS brands, (SELECT count(*) FROM products WHERE brand_id IS NOT NULL)::int AS "withBrand"`,
  );
  console.log('Attached to', attached, 'products |', counts);
  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
