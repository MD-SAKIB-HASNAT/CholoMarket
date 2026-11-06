import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CursorQueryDto } from 'src/common/pagination';
import {
  INVENTORY_REASONS,
  PRODUCT_CONDITIONS,
  WARRANTY_TYPES,
  type InventoryReason,
  type ProductCondition,
  type WarrantyType,
} from 'src/database/enums';

const urlOpts = { require_tld: false, require_protocol: true };

export class VariantInputDto {
  /** Existing variant id; omit to create a new variant. */
  @IsOptional()
  @IsInt()
  id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  sku?: string;

  /** {"size":"M","color":"Red"} */
  @IsOptional()
  @IsObject()
  attributes?: Record<string, string>;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  compareAtPrice?: number | null;

  /** Hidden bargaining floor. */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  minOfferPrice?: number | null;

  /** Opening stock for new variants. Change existing stock with the stock endpoint. */
  @IsOptional()
  @IsInt()
  @Min(0)
  stockQty?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ProductInputDto {
  @IsInt()
  categoryId: number;

  @IsOptional()
  @IsInt()
  brandId?: number | null;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  nameEn: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  nameBn?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @IsIn(PRODUCT_CONDITIONS)
  condition?: ProductCondition;

  @IsOptional()
  @IsIn(WARRANTY_TYPES)
  warrantyType?: WarrantyType;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  warrantyMonths?: number | null;

  @IsOptional()
  @IsBoolean()
  isNegotiable?: boolean;

  @IsOptional()
  @IsIn(['draft', 'active', 'hidden'])
  status?: 'draft' | 'active' | 'hidden';

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl(urlOpts, { each: true })
  images?: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => VariantInputDto)
  variants: VariantInputDto[];
}

export class ProductListQueryDto extends CursorQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(['draft', 'active', 'hidden', 'archived', 'low_stock'])
  status?: string;
}

export class StockUpdateDto {
  /** set = count after a stock-take; adjust = +/- change (e.g. -1 sold in store). */
  @IsIn(['set', 'adjust'])
  mode: 'set' | 'adjust';

  @IsInt()
  @Min(-10000)
  @Max(100000)
  quantity: number;

  @IsOptional()
  @IsIn(INVENTORY_REASONS)
  reason?: InventoryReason;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}

export class ProductStatusDto {
  @IsIn(['active', 'hidden', 'archived']) status:
    'active' | 'hidden' | 'archived';
}
