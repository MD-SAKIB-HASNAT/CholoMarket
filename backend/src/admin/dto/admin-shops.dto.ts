import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CursorQueryDto } from 'src/common/pagination';
import { SHOP_STATUSES, type ShopStatus } from 'src/database/enums';

export class OnboardShopDto {
  @IsInt() marketId: number;
  @IsOptional() @IsInt() floorId?: number;
  @IsOptional() @IsString() @MaxLength(20) shopNumber?: string;
  @IsOptional() @IsInt() walkOrder?: number;
  @IsString() @MinLength(2) @MaxLength(100) nameEn: string;
  @IsOptional() @IsString() @MaxLength(100) nameBn?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsInt() primaryCategoryId: number;
  @IsOptional() @IsArray() @IsInt({ each: true }) categoryIds?: number[];
  @IsOptional() @IsString() @Length(11, 14) phone?: string;
  /** The shop owner's mobile; an account is created if they are new. */
  @IsString() @Length(11, 14) ownerPhone: string;
  @IsOptional() @IsString() @MaxLength(80) ownerName?: string;
  @IsOptional() @IsIn(SHOP_STATUSES) status?: ShopStatus;
}

export class UpdateShopDto {
  @IsOptional() @IsIn(SHOP_STATUSES) status?: ShopStatus;
  @IsOptional() @IsInt() floorId?: number | null;
  @IsOptional() @IsString() @MaxLength(20) shopNumber?: string | null;
  @IsOptional() @IsInt() walkOrder?: number | null;
  @IsOptional() @IsNumber() @Min(0) @Max(100) mapX?: number | null;
  @IsOptional() @IsNumber() @Min(0) @Max(100) mapY?: number | null;
  @IsOptional() @IsInt() primaryCategoryId?: number;
  @IsOptional() @IsString() @MaxLength(100) nameEn?: string;
  @IsOptional() @IsString() @MaxLength(100) nameBn?: string | null;
}

export class ShopQueryDto extends CursorQueryDto {
  @IsOptional() @IsIn(SHOP_STATUSES) status?: ShopStatus;
  @IsOptional() @Type(() => Number) @IsInt() marketId?: number;
  @IsOptional() @IsString() q?: string;
}

export class SubscriptionDto {
  @IsString() planCode: string;
}
