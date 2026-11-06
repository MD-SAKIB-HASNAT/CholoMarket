import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AuthGuard,
  type AuthUser,
  CurrentUser,
  Role,
  Roles,
  RolesGuard,
} from 'src/auth';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';
import {
  ShopOrderActionDto,
  ShopOrderQueryDto,
} from 'src/shop-portal/dto/shop-orders.dto';
import { ShopOrdersService } from 'src/shop-portal/services/shop-orders.service';

@ApiTags('shop portal')
@Controller('shop-portal/:shopId')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class ShopOrdersController {
  constructor(private readonly orders: ShopOrdersService) {}

  @Roles(Role.ShopStaff, Role.ShopManager)
  @Get('orders')
  async list(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Query() q: ShopOrderQueryDto,
  ) {
    return {
      message: 'Shop portal fetched successfully',
      result: await this.orders.list(shopId, q),
    };
  }

  @Roles(Role.ShopStaff, Role.ShopManager)
  @Get('orders/:id')
  async detail(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return {
      message: 'Shop portal fetched successfully',
      result: await this.orders.detail(shopId, id),
    };
  }

  @Roles(Role.ShopStaff, Role.ShopManager)
  @HttpCode(200)
  @Post('orders/:id/action')
  async act(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Body() dto: ShopOrderActionDto,
  ) {
    return {
      message: 'Act completed successfully',
      result: await this.orders.act(shopId, id, user.id, dto),
    };
  }
}
