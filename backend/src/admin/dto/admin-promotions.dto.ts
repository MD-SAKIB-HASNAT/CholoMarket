import { PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { DISCOUNT_TYPES } from 'src/database/enums';

const IMAGE_REF = /^(https?:\/\/|\/)\S+$/;

export class CommissionRuleDto {
  @IsOptional() @IsInt() categoryId?: number | null;
  @IsOptional() @IsInt() marketId?: number | null;
  @IsOptional() @IsInt() shopId?: number | null;
  @IsNumber() @Min(0) @Max(100) rate: number;
  @IsDateString() validFrom: string;
  @IsOptional() @IsDateString() validTo?: string | null;
  @IsOptional() @IsString() @MaxLength(200) note?: string;
}

export class BannerInputDto {
  @IsString() @MinLength(3) @MaxLength(80) title: string;
  @IsOptional() @IsString() @MaxLength(200) subtitle?: string;
  /** A full URL, or a path on the web app such as /banners/journey-wide.png */
  @Matches(IMAGE_REF, {
    message: 'imageUrl must be a URL or a path starting with /',
  })
  imageUrl: string;
  @IsOptional()
  @Matches(IMAGE_REF, {
    message: 'mobileImageUrl must be a URL or a path starting with /',
  })
  mobileImageUrl?: string;
  /** True when the artwork already shows the headline (no text drawn over it). */
  @IsOptional() @IsBoolean() imageHasText?: boolean;
  /** Where it leads, e.g. /markets/shapla-city-mall */
  @IsString() @MaxLength(200) linkUrl: string;
  @IsOptional() @IsIn(['home_banner', 'market_featured']) placement?: string;
  @IsOptional()
  @IsIn(['shop', 'market', 'brand', 'external'])
  advertiser?: string;
  @IsOptional() @IsInt() shopId?: number;
  @IsOptional() @IsInt() marketId?: number;
  @IsDateString() startsAt: string;
  @IsDateString() endsAt: string;
  @IsOptional()
  @IsIn(['draft', 'scheduled', 'running', 'ended', 'cancelled'])
  status?: string;
}

export class CouponInputDto {
  @IsString() @MinLength(3) @MaxLength(30) code: string;
  @IsIn(['platform', 'shop', 'market']) fundedBy:
    'platform' | 'shop' | 'market';
  @IsOptional() @IsInt() shopId?: number;
  @IsOptional() @IsInt() marketId?: number;
  @IsIn(DISCOUNT_TYPES) discountType: 'percent' | 'fixed';
  @IsNumber() @IsPositive() discountValue: number;
  @IsOptional() @IsNumber() @IsPositive() maxDiscount?: number;
  @IsOptional() @IsNumber() @Min(0) minOrderTotal?: number;
  @IsOptional() @IsInt() @Min(1) usageLimit?: number;
  @IsOptional() @IsInt() @Min(1) perUserLimit?: number;
  @IsDateString() startsAt: string;
  @IsDateString() endsAt: string;
}

export class ToggleCouponDto {
  @IsBoolean() isActive: boolean;
}

export class UpdateBannerDto extends PartialType(BannerInputDto) {}
