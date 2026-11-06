import type { ProductSort } from 'src/catalog/dto/products.dto';
import { nameExpr } from 'src/catalog/helpers/name-search';
import type { SortKey } from 'src/common/pagination';

/** Biggest percentage off among a product's active variants. */
const DISCOUNT_EXPR = `(SELECT COALESCE(MAX(1 - v.price / v.compare_at_price), 0) FROM product_variants v
  WHERE v.product_id = p.id AND v.is_active AND v.compare_at_price > v.price)`;

export interface ProductOrder {
  keys: SortKey[];
  /** Direction of the final id tie-breaker. */
  tieDir: 'ASC' | 'DESC';
}

/**
 * The sort order for each choice, as cursor keys. Every key is NOT NULL (COALESCE where needed),
 * which keeps the "rows after this cursor" comparison exact.
 */
export function productOrder(
  sort: ProductSort,
  nearest?: SortKey,
): ProductOrder {
  switch (sort) {
    case 'nearest':
      return { keys: [nearest!], tieDir: 'ASC' };
    case 'relevance':
      return {
        keys: [
          {
            expr: `word_similarity(:q, ${nameExpr('p')})::numeric`,
            dir: 'DESC',
            type: 'numeric',
          },
        ],
        tieDir: 'DESC',
      };
    case 'price_asc':
      return {
        keys: [
          {
            expr: 'COALESCE(p.min_price, 999999999)',
            dir: 'ASC',
            type: 'numeric',
          },
        ],
        tieDir: 'ASC',
      };
    case 'price_desc':
      return {
        keys: [
          { expr: 'COALESCE(p.min_price, 0)', dir: 'DESC', type: 'numeric' },
        ],
        tieDir: 'DESC',
      };
    case 'rating':
      return {
        keys: [
          { expr: 'p.rating_avg', dir: 'DESC', type: 'numeric' },
          { expr: 'p.rating_count', dir: 'DESC', type: 'int' },
        ],
        tieDir: 'DESC',
      };
    case 'discount':
      return {
        keys: [{ expr: DISCOUNT_EXPR, dir: 'DESC', type: 'numeric' }],
        tieDir: 'DESC',
      };
    case 'newest':
      return {
        keys: [{ expr: 'p.created_at', dir: 'DESC', type: 'timestamptz' }],
        tieDir: 'DESC',
      };
  }
}
