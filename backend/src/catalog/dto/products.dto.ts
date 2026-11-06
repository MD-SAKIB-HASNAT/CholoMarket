import { IntersectionType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CursorQueryDto } from 'src/common/pagination';
import { NearbyQueryDto } from 'src/geo/dto/location-filter.dto';

const toBool = ({ value }: { value: unknown }) =>
  value === undefined
    ? undefined
    : value === true || value === 'true' || value === '1';

/** `nearest` needs `nearby=true`; `relevance` needs `q`. Without `sort`: relevance for a search, nearest for nearby, else newest. */
export const PRODUCT_SORTS = [
  'relevance',
  'newest',
  'price_asc',
  'price_desc',
  'rating',
  'discount',
  'nearest',
] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

/**
 * Product list: search by name, category (with its sub-categories), brand and price, optionally nearby
 * (products of shops whose market is within the admin-set radius). Cursor-paged.
 */
export class ProductQueryDto extends IntersectionType(
  CursorQueryDto,
  NearbyQueryDto,
) {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  brandId?: number;

  /** Used by a shop's own page. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  shopId?: number;

  /** Used by a mall's own page. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  marketId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  inStock?: boolean;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  negotiable?: boolean;

  /** Only products with a struck-through "was" price. */
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  onSale?: boolean;

  @IsOptional()
  @IsIn(PRODUCT_SORTS)
  sort?: ProductSort;
}
