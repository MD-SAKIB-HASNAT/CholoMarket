import { IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { SHOP_ROLES, type ShopRole } from 'src/database/enums';

export class AddMemberDto {
  @IsString() @Length(11, 14) phone: string;
  @IsOptional() @IsString() @MaxLength(80) fullName?: string;
  @IsIn(SHOP_ROLES.filter((r) => r !== 'owner')) role: ShopRole;
}
