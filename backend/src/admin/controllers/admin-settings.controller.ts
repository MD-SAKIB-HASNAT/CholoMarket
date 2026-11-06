import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SettingDto } from 'src/admin/dto/admin-settings.dto';
import { AdminSettingsService } from 'src/admin/services/admin-settings.service';
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
@Controller('admin/settings')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
@Roles(Role.Staff)
export class AdminSettingsController {
  constructor(private readonly settings: AdminSettingsService) {}

  @Get()
  async all() {
    return {
      message: 'Settings fetched successfully',
      result: await this.settings.all(),
    };
  }

  @Roles(Role.SuperAdmin)
  @Put(':key')
  async set(
    @Param('key') key: string,
    @Body() dto: SettingDto,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      message: 'Setting updated successfully',
      result: await this.settings.set(key, dto.value, user.id),
    };
  }
}
