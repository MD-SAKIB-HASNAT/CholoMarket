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
import { CursorQueryDto } from 'src/common/pagination';
import { OrdersService } from 'src/orders/services/orders.service';
import {
  ReplyDto,
  ReturnActionDto,
} from 'src/shop-portal/dto/shop-after-sale.dto';

/** Returns and reviews of the shop's orders. The logic lives in the orders module. */
@ApiTags('shop portal')
@Controller('shop-portal/:shopId')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class ShopAfterSaleController {
  constructor(private readonly orders: OrdersService) {}

  @Roles(Role.ShopStaff, Role.ShopManager)
  @Get('returns')
  async returns(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Query() q: CursorQueryDto,
  ) {
    return {
      message: 'Shop portal fetched successfully',
      result: await this.orders.shopReturns(shopId, q),
    };
  }

  @Roles(Role.ShopManager)
  @HttpCode(200)
  @Post('returns/:id/respond')
  async respondReturn(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Body() dto: ReturnActionDto,
  ) {
    return {
      message: 'Respond return completed successfully',
      result: await this.orders.respondToReturn(
        shopId,
        id,
        user.id,
        dto.action,
        dto.resolution,
        dto.note,
      ),
    };
  }

  @Roles(Role.ShopStaff, Role.ShopManager)
  @Get('reviews')
  async reviews(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Query() q: CursorQueryDto,
  ) {
    return {
      message: 'Shop portal fetched successfully',
      result: await this.orders.listReviews({ shopId }, q),
    };
  }

  @Roles(Role.ShopManager)
  @Post('reviews/:id/reply')
  async replyReview(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplyDto,
  ) {
    return {
      message: 'Reply review completed successfully',
      result: await this.orders.replyToReview(shopId, id, dto.reply),
    };
  }
}
