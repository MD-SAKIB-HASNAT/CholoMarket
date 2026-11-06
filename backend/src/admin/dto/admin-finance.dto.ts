import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class PayoutDto {
  @IsInt() shopId: number;
  @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive() amount: number;
  @IsOptional() @IsString() @MaxLength(80) reference?: string;
}
