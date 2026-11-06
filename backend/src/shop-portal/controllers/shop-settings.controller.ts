import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard, Role, Roles, RolesGuard } from 'src/auth';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';
import {
  ShopHoursDto,
  ShopSettingsDto,
  VerificationInputDto,
} from 'src/shop-portal/dto/shop-settings.dto';
import { ShopSettingsService } from 'src/shop-portal/services/shop-settings.service';

/** Profile, hours and trade documents: managers see and edit them. */
@ApiTags('shop portal')
@Controller('shop-portal/:shopId')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class ShopSettingsController {
  constructor(private readonly settings: ShopSettingsService) {}

  @Roles(Role.ShopManager)
  @Get('settings')
  async get(@Param('shopId', ParseIntPipe) shopId: number) {
    return {
      message: 'Shop portal fetched successfully',
      result: await this.settings.settings(shopId),
    };
  }

  @Roles(Role.ShopManager)
  @Patch('settings')
  async update(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Body() dto: ShopSettingsDto,
  ) {
    return {
      message: 'Shop portal updated successfully',
      result: await this.settings.updateSettings(shopId, dto),
    };
  }

  @Roles(Role.ShopManager)
  @Put('hours')
  async setHours(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Body() dto: ShopHoursDto,
  ) {
    return {
      message: 'Shop portal updated successfully',
      result: await this.settings.setHours(shopId, dto),
    };
  }

  @Roles(Role.ShopManager)
  @Get('verifications')
  async verifications(@Param('shopId', ParseIntPipe) shopId: number) {
    return {
      message: 'Shop portal fetched successfully',
      result: await this.settings.listVerifications(shopId),
    };
  }

  @Roles(Role.ShopManager)
  @Post('verifications')
  async submitVerification(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Body() dto: VerificationInputDto,
  ) {
    return {
      message: 'Shop portal created successfully',
      result: await this.settings.submitVerification(shopId, dto),
    };
  }
}
