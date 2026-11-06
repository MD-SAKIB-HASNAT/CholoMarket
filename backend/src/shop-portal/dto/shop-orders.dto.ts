import { IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { CursorQueryDto } from 'src/common/pagination';
import { SHOP_ORDER_STATUSES, type ShopOrderStatus } from 'src/database/enums';

export class ShopOrderQueryDto extends CursorQueryDto {
  @IsOptional()
  @IsIn([...SHOP_ORDER_STATUSES, 'active'])
  status?: ShopOrderStatus | 'active';
}

export class ShopOrderActionDto {
  @IsIn(['confirm', 'ready', 'complete', 'reject'])
  action: 'confirm' | 'ready' | 'complete' | 'reject';

  /** Required for complete. */
  @IsOptional()
  @IsString()
  @Length(6, 6)
  pickupCode?: string;

  /** Required for reject. */
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}
