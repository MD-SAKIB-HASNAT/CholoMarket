import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { VERIFICATION_KINDS, type VerificationKind } from 'src/database/enums';

const urlOpts = { require_tld: false, require_protocol: true };

export class ShopSettingsDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100) nameEn?: string;
  @IsOptional() @IsString() @MaxLength(100) nameBn?: string | null;
  @IsOptional() @IsString() @MaxLength(2000) description?: string | null;
  @IsOptional() @IsUrl(urlOpts) logoUrl?: string | null;
  @IsOptional() @IsUrl(urlOpts) coverUrl?: string | null;
  @IsOptional() @IsString() @Length(11, 14) phone?: string | null;
  @IsOptional() @IsString() @Length(11, 14) whatsapp?: string | null;
  @IsOptional() @IsBoolean() acceptsOffers?: boolean;
  @IsOptional() @IsBoolean() acceptsCashOnPickup?: boolean;
  @IsOptional() @IsBoolean() offersDelivery?: boolean;
  @IsOptional() @IsNumber() @Min(0) @Max(100) depositPercent?: number;
  @IsOptional() @IsInt() @Min(2) @Max(168) reservationHours?: number;
  @IsOptional() @IsInt() @Min(0) @Max(30) returnWindowDays?: number;
  @IsOptional() @IsString() @MaxLength(2000) returnPolicy?: string | null;
  @IsOptional() @IsString() @MaxLength(2000) warrantyPolicy?: string | null;
  @IsOptional() @IsArray() @IsInt({ each: true }) categoryIds?: number[];
}

export class ShopHoursItemDto {
  @IsInt() @Min(0) @Max(6) weekday: number;
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) opensAt?: string | null;
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) closesAt?: string | null;
  @IsBoolean() isClosed: boolean;
}

export class ShopHoursDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShopHoursItemDto)
  hours: ShopHoursItemDto[];
}

export class VerificationInputDto {
  @IsIn(VERIFICATION_KINDS.filter((k) => k !== 'physical_visit'))
  kind: VerificationKind;

  @IsOptional() @IsString() @MaxLength(60) documentNumber?: string;
  @IsOptional() @IsUrl(urlOpts) documentUrl?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) expiresOn?: string;
}
