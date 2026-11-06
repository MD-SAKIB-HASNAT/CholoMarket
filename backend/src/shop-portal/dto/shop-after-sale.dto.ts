import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ReturnActionDto {
  @IsIn(['approve', 'reject', 'receive', 'resolve']) action:
    'approve' | 'reject' | 'receive' | 'resolve';
  @IsOptional()
  @IsIn(['refund', 'exchange', 'store_credit', 'repair'])
  resolution?: 'refund' | 'exchange' | 'store_credit' | 'repair';
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class ReplyDto {
  @IsString() @MinLength(1) @MaxLength(1000) reply: string;
}
