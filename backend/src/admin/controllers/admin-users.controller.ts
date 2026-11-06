import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  StaffRoleDto,
  UserQueryDto,
  UserStatusDto,
} from 'src/admin/dto/admin-users.dto';
import { AdminUsersService } from 'src/admin/services/admin-users.service';
import {
  AuthGuard,
  type AuthUser,
  CurrentUser,
  Role,
  Roles,
  RolesGuard,
} from 'src/auth';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';

@ApiTags('admin')
@Controller('admin/users')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
@Roles(Role.Staff)
export class AdminUsersController {
  constructor(private readonly users: AdminUsersService) {}

  @Get()
  async list(@Query() q: UserQueryDto) {
    return {
      message: 'Users fetched successfully',
      result: await this.users.list(q),
    };
  }

  @Roles(Role.SuperAdmin)
  @Put(':id/staff-role')
  async staffRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: StaffRoleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      message: 'Staff role completed successfully',
      result: await this.users.setStaffRole(id, dto.role ?? null, user.id),
    };
  }

  @Roles(Role.Ops, Role.Support)
  @Put(':id/status')
  async status(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UserStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      message: 'Status completed successfully',
      result: await this.users.setStatus(id, dto.status, user.id),
    };
  }
}
