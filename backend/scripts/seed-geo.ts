// Adds the demo locations (8 divisions, 64 districts, sample areas and sub-areas) to the CURRENT database
// without touching anything else, then gives the four seeded markets their sub-area and sets the nearby radius if unset.
// Safe to run again. Usage: npm run seed:geo
import { config } from 'dotenv';
import 'reflect-metadata';
import { AppDataSource } from 'src/database/postgres/data-source';
import { AREAS, DIVISIONS, MARKET_PLACES } from './geo-data';

async function main() {
  config();
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to touch a production database.');
    process.exit(1);
  }

  await AppDataSource.initialize();
  const db = AppDataSource;

  const id = async (sql: string, params: unknown[]) =>
    (await db.query<{ id: number }[]>(sql, params))[0]?.id;

  let added = { districts: 0, areas: 0, subAreas: 0 };
  for (const division of DIVISIONS) {
    await db.query(
      `INSERT INTO divisions (name_en, name_bn) VALUES ($1, $2) ON CONFLICT (name_en) DO NOTHING`,
      division.name,
    );
    const divisionId = await id(`SELECT id FROM divisions WHERE name_en = $1`, [
      division.name[0],
    ]);
    for (const [en, bn] of division.districts) {
      const res = await db.query(
        `INSERT INTO districts (division_id, name_en, name_bn) VALUES ($1, $2, $3) ON CONFLICT (division_id, name_en) DO NOTHING RETURNING id`,
        [divisionId, en, bn],
      );
      added.districts += res.length;
      const districtId = await id(
        `SELECT id FROM districts WHERE division_id = $1 AND name_en = $2`,
        [divisionId, en],
      );
      for (const area of AREAS[`${division.name[0]}/${en}`] ?? []) {
        const a = await db.query(
          `INSERT INTO areas (district_id, name_en, name_bn, kind, is_serviceable) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (district_id, name_en) DO NOTHING RETURNING id`,
          [
            districtId,
            area.name[0],
            area.name[1],
            area.kind ?? 'thana',
            area.serviceable ?? false,
          ],
        );
        added.areas += a.length;
        const areaId = await id(
          `SELECT id FROM areas WHERE district_id = $1 AND name_en = $2`,
          [districtId, area.name[0]],
        );
        for (const [subEn, subBn] of area.subAreas) {
          const s = await db.query(
            `INSERT INTO sub_areas (area_id, name_en, name_bn) VALUES ($1, $2, $3) ON CONFLICT (area_id, name_en) DO NOTHING RETURNING id`,
            [areaId, subEn, subBn],
          );
          added.subAreas += s.length;
        }
      }
    }
  }

  // The seeded markets (matched by slug) get their neighbourhood.
  const SLUGS: Record<string, string> = {
    shapla: 'shapla-city-mall',
    padma: 'padma-trade-centre',
    mirpur: 'mirpur-bazaar-complex',
    chawk: 'karnaphuli-shopping-centre',
  };
  let placed = 0;
  for (const [key, [district, areaName, subName]] of Object.entries(
    MARKET_PLACES,
  )) {
    const res = await db.query(
      `UPDATE markets m SET area_id = a.id, sub_area_id = sa.id
         FROM areas a JOIN districts d ON d.id = a.district_id JOIN divisions dv ON dv.id = d.division_id
              JOIN sub_areas sa ON sa.area_id = a.id
        WHERE m.slug = $1 AND dv.name_en || '/' || d.name_en = $2 AND a.name_en = $3 AND sa.name_en = $4 RETURNING m.id`,
      [SLUGS[key], district, areaName, subName],
    );
    placed += res.length;
  }
  await db.query(
    `INSERT INTO platform_settings (key, value) VALUES ('nearby_max_km', '0.5'::jsonb) ON CONFLICT (key) DO NOTHING`,
  );

  const [counts] = await db.query(
    `SELECT (SELECT count(*) FROM divisions)::int AS divisions, (SELECT count(*) FROM districts)::int AS districts,
            (SELECT count(*) FROM areas)::int AS areas, (SELECT count(*) FROM sub_areas)::int AS "subAreas"`,
  );
  console.log('Added', added, '| markets placed:', placed, '| totals:', counts);
  await AppDataSource.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
