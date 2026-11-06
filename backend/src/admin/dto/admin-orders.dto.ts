import { IsIn, IsOptional, IsString } from 'class-validator';
import { CursorQueryDto } from 'src/common/pagination';
import { SHOP_ORDER_STATUSES } from 'src/database/enums';

export class AdminOrderQueryDto extends CursorQueryDto {
  @IsOptional() @IsIn(SHOP_ORDER_STATUSES) status?: string;
  @IsOptional() @IsString() q?: string;
}
