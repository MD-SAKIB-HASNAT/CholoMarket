import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type ValueTransformer,
} from 'typeorm';

/** Postgres returns numeric as string; expose it as a JS number rounded to 2 decimals. */
export const numericTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? value : Number(value),
};

/** BDT money: numeric(12,2). */
export function MoneyColumn(
  options: { nullable?: boolean; default?: number; name?: string } = {},
) {
  return Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
    nullable: options.nullable ?? false,
    default: options.nullable ? undefined : (options.default ?? 0),
    name: options.name,
  });
}

/** Percentage 0-100 with 2 decimals: numeric(5,2). */
export function PercentColumn(
  options: { default?: number; nullable?: boolean } = {},
) {
  return Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    transformer: numericTransformer,
    nullable: options.nullable ?? false,
    default: options.nullable ? undefined : (options.default ?? 0),
  });
}

export function CoordinateColumn() {
  return Column({
    type: 'numeric',
    precision: 9,
    scale: 6,
    nullable: true,
    transformer: numericTransformer,
  });
}

/** int identity PK for entity tables. */
export function IdColumn() {
  return PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' });
}

/** bigint identity PK for append-only, high-volume tables (returned as string). */
export function BigIdColumn() {
  return PrimaryGeneratedColumn('identity', {
    type: 'bigint',
    generatedIdentity: 'ALWAYS',
  });
}

export function CreatedAt() {
  return CreateDateColumn({ type: 'timestamptz' });
}

export function UpdatedAt() {
  return UpdateDateColumn({ type: 'timestamptz' });
}

export function Timestamp(
  options: { nullable?: boolean } = { nullable: true },
) {
  return Column({ type: 'timestamptz', nullable: options.nullable ?? true });
}

/** Short status/kind text column; pair with @Check(inList(...)) on the entity. */
export function StatusColumn(defaultValue?: string, length = 30) {
  return Column({ type: 'varchar', length, default: defaultValue });
}
