import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CursorQueryDto } from 'src/common/pagination';
import { AREA_KINDS } from 'src/database/enums';

/** Create or edit a division, district, area or sub-area; which fields apply depends on the level. */
export class GeoInputDto {
  @IsOptional() @IsString() @MaxLength(100) nameEn?: string;
  @IsOptional() @IsString() @MaxLength(100) nameBn?: string;
  /** The division / district / area it belongs to (not used for divisions). */
  @IsOptional() @IsInt() @Min(1) parentId?: number;
  /** Areas only. */
  @IsOptional() @IsIn(AREA_KINDS) kind?: string;
  /** Areas only: home delivery coverage. */
  @IsOptional() @IsBoolean() isServiceable?: boolean;
  /** Hidden from the pickers when false. */
  @IsOptional() @IsBoolean() isActive?: boolean;
}

/** `?q=` searches either name; the ancestor ids narrow a level (areas of a district, …). */
export class GeoListQueryDto extends CursorQueryDto {
  @IsOptional() @IsString() @MaxLength(100) q?: string;
  @IsOptional() @Type(() => Number) @IsInt() divisionId?: number;
  @IsOptional() @Type(() => Number) @IsInt() districtId?: number;
  @IsOptional() @Type(() => Number) @IsInt() areaId?: number;
}

export class GeoLookupQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() divisionId?: number;
  @IsOptional() @Type(() => Number) @IsInt() districtId?: number;
  @IsOptional() @Type(() => Number) @IsInt() areaId?: number;
}
