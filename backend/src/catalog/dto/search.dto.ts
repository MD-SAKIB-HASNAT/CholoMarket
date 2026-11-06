import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { SEARCH_SCOPES, type SearchScope } from 'src/database/enums';

/** One box for everything: the best few markets, shops and products for a name. */
export class SearchQueryDto {
  @IsString()
  @MaxLength(100)
  q: string;

  @IsOptional()
  @IsIn(SEARCH_SCOPES)
  scope?: SearchScope;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;
}
