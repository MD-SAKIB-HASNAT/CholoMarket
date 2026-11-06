import { BadRequestException } from '@nestjs/common';
import {
  DEFAULT_PAGE_SIZE,
  type CursorQueryDto,
} from 'src/common/pagination/cursor.dto';
import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

/**
 * Keyset ("cursor") pagination. A page is found by comparing the sort columns with the last row of the
 * previous page instead of skipping rows, so every page costs the same however deep the user scrolls and
 * rows added meanwhile never repeat or vanish.
 */

export type KeyType =
  'text' | 'int' | 'bigint' | 'numeric' | 'timestamptz' | 'boolean';

/** One column of the sort order. `expr` must never be NULL (wrap nullable columns in COALESCE). */
export interface SortKey {
  expr: string;
  dir: 'ASC' | 'DESC';
  type: KeyType;
}

/** What every list endpoint returns. */
export interface CursorPage<T> {
  items: T[];
  /** Send as `?cursor=` to get the next page; null on the last page. */
  nextCursor: string | null;
  hasMore: boolean;
}

export interface KeysetResult {
  /** Ids of this page, in sort order. */
  ids: number[];
  nextCursor: string | null;
  hasMore: boolean;
  /** The raw rows (id + k0, k1… sort values; timestamps also as text c0, c1…), for callers that need the computed values (e.g. a distance). */
  rows: Record<string, unknown>[];
}

const normalise = (v: unknown) =>
  v instanceof Date
    ? v.toISOString()
    : typeof v === 'bigint'
      ? v.toString()
      : v;

export const encodeCursor = (values: unknown[]): string =>
  Buffer.from(JSON.stringify(values.map(normalise))).toString('base64url');

/** The values inside a cursor, or null for the first page. A cursor from another sort order is refused. */
export function decodeCursor(
  cursor: string | undefined,
  width: number,
): unknown[] | null {
  if (!cursor) return null;
  try {
    const values: unknown = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    );
    if (
      Array.isArray(values) &&
      values.length === width &&
      values.every((v) => v !== undefined)
    )
      return values;
  } catch {
    // fall through
  }
  throw new BadRequestException(
    'That page marker is not valid any more. Reload the list.',
  );
}

/**
 * SQL for "rows after this cursor" in the given order, e.g. for (a DESC, b ASC, id ASC):
 *   a < :a OR (a = :a AND b > :b) OR (a = :a AND b = :b AND id > :id)
 */
export function keysetCondition(
  keys: SortKey[],
  values: unknown[],
  prefix = 'ks',
): { sql: string; params: Record<string, unknown> } {
  const params: Record<string, unknown> = {};
  const equal: string[] = [];
  const branches = keys.map((key, i) => {
    params[`${prefix}${i}`] = values[i];
    const value = `(:${prefix}${i})::${key.type}`;
    const branch = `(${[...equal, `${key.expr} ${key.dir === 'ASC' ? '>' : '<'} ${value}`].join(' AND ')})`;
    equal.push(`${key.expr} = ${value}`);
    return branch;
  });
  return { sql: `(${branches.join(' OR ')})`, params };
}

export interface KeysetOptions {
  /** Column that identifies a row, e.g. `m.id`; it is the final tie-breaker so the order is total. */
  idExpr: string;
  keys: SortKey[];
  /** Direction of the id tie-breaker (default ASC; use DESC for newest-first lists). */
  tieDir?: 'ASC' | 'DESC';
  /** SQL type of the id (default int; `bigint` for tables with bigint ids such as notifications). */
  idType?: KeyType;
  page: CursorQueryDto;
}

/**
 * Runs one page of a filtered query and returns the ids with the cursor for the next page.
 * `qb` carries the FROM, joins and filters only; this adds the select, keyset condition, order and limit.
 * Load the full rows afterwards with `WHERE id IN (ids)` and put them back in `ids` order.
 */
export async function keysetIds(
  qb: SelectQueryBuilder<ObjectLiteral>,
  { idExpr, keys, tieDir = 'ASC', idType = 'int', page }: KeysetOptions,
): Promise<KeysetResult> {
  const limit = page.limit ?? DEFAULT_PAGE_SIZE;
  const order: SortKey[] = [
    ...keys,
    { expr: idExpr, dir: tieDir, type: idType },
  ];

  qb.select(idExpr, 'id');
  keys.forEach((key, i) => {
    qb.addSelect(key.expr, `k${i}`);
    // A JS Date only keeps milliseconds, Postgres keeps microseconds: the cursor carries the exact text instead.
    if (key.type === 'timestamptz')
      qb.addSelect(`(${key.expr})::text`, `c${i}`);
  });

  const after = decodeCursor(page.cursor, order.length);
  if (after) {
    const { sql, params } = keysetCondition(order, after);
    qb.andWhere(sql, params);
  }
  order.forEach((key, i) => {
    const column = i === order.length - 1 ? 'id' : `k${i}`; // sort by the selected aliases
    if (i === 0) qb.orderBy(column, key.dir);
    else qb.addOrderBy(column, key.dir);
  });

  const fetched = await qb
    .limit(limit + 1)
    .getRawMany<Record<string, unknown>>();
  const hasMore = fetched.length > limit;
  const rows = hasMore ? fetched.slice(0, limit) : fetched;
  const last = rows.at(-1);
  const nextCursor =
    hasMore && last
      ? encodeCursor([
          ...keys.map(
            (key, i) => last[key.type === 'timestamptz' ? `c${i}` : `k${i}`],
          ),
          last.id,
        ])
      : null;
  return { ids: rows.map((r) => Number(r.id)), nextCursor, hasMore, rows };
}

/** Puts loaded entities back in the order of `ids` (an `IN (…)` query does not keep it). */
export function inOrder<T extends { id: number }>(
  ids: number[],
  entities: T[],
): T[] {
  const byId = new Map(entities.map((e) => [e.id, e]));
  return ids.map((id) => byId.get(id)).filter((e): e is T => !!e);
}

export const emptyPage = <T>(): CursorPage<T> => ({
  items: [],
  nextCursor: null,
  hasMore: false,
});

/** Wraps items and the cursor info of a `keysetIds` result into the response shape. */
export const toCursorPage = <T>(
  items: T[],
  result: Pick<KeysetResult, 'nextCursor' | 'hasMore'>,
): CursorPage<T> => ({
  items,
  nextCursor: result.nextCursor,
  hasMore: result.hasMore,
});
