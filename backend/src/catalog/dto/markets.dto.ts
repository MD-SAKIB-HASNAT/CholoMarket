import { IntersectionType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { CursorQueryDto } from 'src/common/pagination';
import { MARKET_KINDS } from 'src/database/enums';
import { LocationFilterDto } from 'src/geo/dto/location-filter.dto';

/** ?q=&kind= plus the location filters (division…sub-area, nearby) and the cursor. */
export class MarketQueryDto extends IntersectionType(
  CursorQueryDto,
  LocationFilterDto,
) {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(MARKET_KINDS)
  kind?: string;
}

export class DirectoryQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  floorId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;
}
