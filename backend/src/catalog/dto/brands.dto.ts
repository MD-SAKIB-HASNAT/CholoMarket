import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CursorQueryDto } from 'src/common/pagination';

export class BrandQueryDto extends CursorQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  q?: string;

  /** Only brands that have products in this category (or its sub-categories). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  /** Also list brands that have no products yet (the shop's brand picker needs them). */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  includeUnused?: boolean;
}

export class BrandInputDto {
  @IsString() @MinLength(2) @MaxLength(60) name: string;
  @IsOptional() @IsString() @MaxLength(80) slug?: string;
  /** Send null on an edit to remove the logo. */
  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  logoUrl?: string | null;
}
