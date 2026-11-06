import { PartialType } from '@nestjs/swagger';
import {
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
} from 'class-validator';
import {
  MARKET_KINDS,
  MARKET_ROLES,
  MARKET_STATUSES,
  type MarketKind,
  type MarketRole,
  type MarketStatus,
} from 'src/database/enums';

const url = { require_tld: false, require_protocol: true };
const time = /^\d{2}:\d{2}$/;

export class MarketInputDto {
  @IsString() @MinLength(2) @MaxLength(100) nameEn: string;
  @IsString() @MinLength(2) @MaxLength(100) nameBn: string;
  @IsOptional() @IsString() @MaxLength(80) slug?: string;
  @IsIn(MARKET_KINDS) kind: MarketKind;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsInt() areaId: number;
  /** Neighbourhood inside the area; null clears it. */
  @IsOptional() @IsInt() subAreaId?: number | null;
  @IsString() @MaxLength(300) addressLine: string;
  @IsOptional() @IsNumber() @Min(-90) @Max(90) latitude?: number;
  @IsOptional() @IsNumber() @Min(-180) @Max(180) longitude?: number;
  @IsOptional() @IsUrl(url) logoUrl?: string;
  @IsOptional() @IsUrl(url) coverUrl?: string;
  @IsOptional() @Matches(time) opensAt?: string;
  @IsOptional() @Matches(time) closesAt?: string;
  @IsOptional() @IsInt() @Min(0) @Max(6) weeklyOffDay?: number | null;
  @IsOptional() @IsBoolean() isPartner?: boolean;
  @IsOptional() @IsIn(MARKET_STATUSES) status?: MarketStatus;
}

export class FloorInputDto {
  @IsInt() @Min(-5) @Max(50) level: number;
  @IsString() @MaxLength(60) nameEn: string;
  @IsOptional() @IsString() @MaxLength(60) nameBn?: string;
  @IsOptional() @IsUrl(url) mapImageUrl?: string;
}

export class PickupPointInputDto {
  @IsString() @MaxLength(80) nameEn: string;
  @IsOptional() @IsString() @MaxLength(80) nameBn?: string;
  @IsOptional() @IsInt() floorId?: number;
  @IsOptional() @IsString() @MaxLength(300) instructions?: string;
  @IsOptional() @Matches(time) opensAt?: string;
  @IsOptional() @Matches(time) closesAt?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class MemberInputDto {
  @IsString() @Length(11, 14) phone: string;
  @IsOptional() @IsString() @MaxLength(80) fullName?: string;
  @IsIn(MARKET_ROLES) role: MarketRole;
}

// PATCH bodies: every field optional, same validation rules.
export class UpdateMarketDto extends PartialType(MarketInputDto) {}
export class UpdateFloorDto extends PartialType(FloorInputDto) {}
export class UpdatePickupPointDto extends PartialType(PickupPointInputDto) {}
