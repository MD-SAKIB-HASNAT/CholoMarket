import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PAYOUT_METHODS, type PayoutMethod } from 'src/database/enums';

export class PayoutAccountDto {
  @IsIn(PAYOUT_METHODS) method: PayoutMethod;
  @IsString() @MaxLength(80) accountName: string;
  @IsString() @MaxLength(40) accountNumber: string;
  @IsOptional() @IsString() @MaxLength(80) bankName?: string;
  @IsOptional() @IsString() @MaxLength(80) branchName?: string;
  @IsOptional() @IsString() @MaxLength(20) routingNumber?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}
