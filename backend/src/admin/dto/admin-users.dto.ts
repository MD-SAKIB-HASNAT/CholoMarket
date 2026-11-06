import { IsIn, IsOptional, IsString } from 'class-validator';
import { CursorQueryDto } from 'src/common/pagination';
import {
  PLATFORM_ROLES,
  USER_STATUSES,
  type PlatformRole,
  type UserStatus,
} from 'src/database/enums';

export class UserQueryDto extends CursorQueryDto {
  @IsOptional() @IsString() q?: string;
}

export class StaffRoleDto {
  @IsOptional() @IsIn([...PLATFORM_ROLES, null]) role: PlatformRole | null;
}

export class UserStatusDto {
  @IsIn(USER_STATUSES) status: UserStatus;
}
