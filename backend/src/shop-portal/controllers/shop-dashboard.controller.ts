import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard, Role, Roles, RolesGuard } from 'src/auth';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';
import { ShopDashboardService } from 'src/shop-portal/services/shop-dashboard.service';

@ApiTags('shop portal')
@Controller('shop-portal/:shopId')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class ShopDashboardController {
  constructor(private readonly dashboard: ShopDashboardService) {}

  @Roles(Role.ShopStaff, Role.ShopManager)
  @Get('dashboard')
  async overview(@Param('shopId', ParseIntPipe) shopId: number) {
    return {
      message: 'Shop portal fetched successfully',
      result: await this.dashboard.dashboard(shopId),
    };
  }
}
