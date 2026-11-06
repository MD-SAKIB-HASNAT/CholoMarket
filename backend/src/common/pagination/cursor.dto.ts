import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

/** Query string of every list: `?limit=20&cursor=<nextCursor from the previous page>`. */
export class CursorQueryDto {
  /** Opaque marker from the previous page's `nextCursor`; leave out for the first page. */
  @IsOptional()
  @IsString()
  @MaxLength(600)
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number = DEFAULT_PAGE_SIZE;
}
