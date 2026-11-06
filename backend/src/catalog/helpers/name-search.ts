import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

/** English and Bangla name of a row, as one searchable string. */
export const nameExpr = (alias: string) =>
  `(${alias}.name_en || ' ' || coalesce(${alias}.name_bn, ''))`;

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * "Search by name": a substring match in English or Bangla, or a close spelling (typo tolerant).
 * Binds :like and :q; `withFullText` also uses the product's search vector.
 */
export function applyNameSearch(
  qb: SelectQueryBuilder<ObjectLiteral>,
  alias: string,
  text: string | undefined,
  withFullText = false,
): void {
  if (!text) return;
  const name = nameExpr(alias);
  const fullText = withFullText
    ? ` OR ${alias}.search_vector @@ plainto_tsquery('simple', :q)`
    : '';
  qb.andWhere(
    `(${name} ILIKE :like${fullText} OR word_similarity(:q, ${name}) > 0.45)`,
    { like: `%${escapeLike(text)}%`, q: text },
  );
}
