import { IsIn, IsNumber, IsOptional, IsPositive } from 'class-validator';
import { CursorQueryDto } from 'src/common/pagination';
import { OFFER_STATUSES, type OfferStatus } from 'src/database/enums';

export class OfferQueryDto extends CursorQueryDto {
  @IsOptional()
  @IsIn(OFFER_STATUSES)
  status?: OfferStatus;
}

export class ShopOfferActionDto {
  @IsIn(['accept', 'reject', 'counter'])
  action: 'accept' | 'reject' | 'counter';

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  counterPrice?: number;
}
