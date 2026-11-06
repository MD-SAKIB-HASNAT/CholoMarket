import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
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
import { CursorQueryDto } from 'src/common/pagination';
import {
  ProductInputDto,
  ProductListQueryDto,
  ProductStatusDto,
  StockUpdateDto,
} from 'src/shop-portal/dto/shop-products.dto';
import { ShopProductsService } from 'src/shop-portal/services/shop-products.service';

/** The shop's catalogue and stock: staff look and adjust stock, managers also edit products. */
@ApiTags('shop portal')
@Controller('shop-portal/:shopId')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class ShopProductsController {
  constructor(private readonly products: ShopProductsService) {}

  @Roles(Role.ShopStaff, Role.ShopManager)
  @Get('products')
  async list(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Query() q: ProductListQueryDto,
  ) {
    return {
      message: 'Shop portal fetched successfully',
      result: await this.products.list(shopId, q),
    };
  }

  @Roles(Role.ShopStaff, Role.ShopManager)
  @Get('products/:id')
  async get(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return {
      message: 'Shop portal fetched successfully',
      result: await this.products.get(shopId, id),
    };
  }

  @Roles(Role.ShopManager)
  @Post('products')
  async create(
    @Param('shopId', ParseIntPipe) shopId: number,
    @CurrentUser() user: AuthUser,
    @Body() dto: ProductInputDto,
  ) {
    return {
      message: 'Shop portal created successfully',
      result: await this.products.create(shopId, user.id, dto),
    };
  }

  @Roles(Role.ShopManager)
  @Put('products/:id')
  async update(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Body() dto: ProductInputDto,
  ) {
    return {
      message: 'Shop portal updated successfully',
      result: await this.products.update(shopId, id, user.id, dto),
    };
  }

  @Roles(Role.ShopManager)
  @HttpCode(200)
  @Post('products/:id/status')
  async setStatus(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProductStatusDto,
  ) {
    return {
      message: 'Set status completed successfully',
      result: await this.products.setStatus(shopId, id, dto.status),
    };
  }

  /** One-tap stock update: { mode: 'adjust', quantity: -1 } = "sold one in the shop". */
  @Roles(Role.ShopStaff, Role.ShopManager)
  @Post('variants/:variantId/stock')
  async updateStock(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('variantId', ParseIntPipe) variantId: number,
    @CurrentUser() user: AuthUser,
    @Body() dto: StockUpdateDto,
  ) {
    return {
      message: 'Update stock completed successfully',
      result: await this.products.updateStock(shopId, variantId, user.id, dto),
    };
  }

  @Roles(Role.ShopStaff, Role.ShopManager)
  @Get('variants/:variantId/stock-history')
  async stockHistory(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('variantId', ParseIntPipe) variantId: number,
    @Query() q: CursorQueryDto,
  ) {
    return {
      message: 'Shop portal fetched successfully',
      result: await this.products.stockHistory(shopId, variantId, q),
    };
  }
}
