import { IntersectionType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CursorQueryDto } from 'src/common/pagination';
import { LocationFilterDto } from 'src/geo/dto/location-filter.dto';

const toBool = ({ value }: { value: unknown }) =>
  value === undefined
    ? undefined
    : value === true || value === 'true' || value === '1';

/** ?q=&categoryId=&verified= plus the location filters (division…sub-area, nearby) and the cursor. */
export class ShopQueryDto extends IntersectionType(
  CursorQueryDto,
  LocationFilterDto,
) {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  /** Used by the mall page; the customer lists are not filtered by market. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  marketId?: number;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  verified?: boolean;
}
