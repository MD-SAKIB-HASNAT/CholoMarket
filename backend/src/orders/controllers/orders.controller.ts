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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
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
  CheckoutDto,
  CreateReturnDto,
  CreateReviewDto,
  MockGatewayDto,
  PayOrderDto,
  ReasonDto,
} from 'src/orders/dto/orders.dto';
import { CheckoutService } from 'src/orders/services/checkout.service';
import { OrderWorkflowService } from 'src/orders/services/order-workflow.service';
import { OrdersService } from 'src/orders/services/orders.service';
import { PaymentsService } from 'src/orders/services/payments.service';

class ReviewQueryDto extends CursorQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  shopId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  productId?: number;
}

@ApiTags('orders')
@ApiBearerAuth()
@Controller()
@UseInterceptors(ResponseInterceptor)
export class OrdersController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly orders: OrdersService,
    private readonly workflow: OrderWorkflowService,
    private readonly payments: PaymentsService,
  ) {}

  /** Cart -> order split per shop. Returns a payment to complete when money is due online. */
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Customer)
  @Post('orders/checkout')
  async checkout(@CurrentUser() user: AuthUser, @Body() dto: CheckoutDto) {
    return {
      message: 'Checkout completed successfully',
      result: await this.checkoutService.checkout(user.id, dto),
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Get('orders')
  async list(@CurrentUser() user: AuthUser, @Query() q: CursorQueryDto) {
    return {
      message: 'Orders fetched successfully',
      result: await this.orders.listForCustomer(user.id, q),
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Get('orders/:orderNo')
  async detail(
    @CurrentUser() user: AuthUser,
    @Param('orderNo') orderNo: string,
  ) {
    return {
      message: 'Orders fetched successfully',
      result: await this.orders.detailForCustomer(user.id, orderNo),
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Post('orders/:orderNo/pay')
  async pay(
    @CurrentUser() user: AuthUser,
    @Param('orderNo') orderNo: string,
    @Body() dto: PayOrderDto,
  ) {
    return {
      message: 'Pay completed successfully',
      result: await this.payments.retry(orderNo, user.id, dto.method),
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @HttpCode(200)
  @Post('orders/:orderNo/shop-orders/:id/cancel')
  async cancel(
    @CurrentUser() user: AuthUser,
    @Param('orderNo') orderNo: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReasonDto,
  ) {
    return {
      message: 'Cancel completed successfully',
      result: await this.workflow.cancelByCustomer(
        user.id,
        orderNo,
        id,
        dto.reason,
      ),
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Get('payments/:id')
  async payment(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return {
      message: 'Orders fetched successfully',
      result: await this.payments.forCustomer(id, user.id),
    };
  }

  /** Development stand-in for the bKash / Nagad checkout page. */
  @UseGuards(AuthGuard, RolesGuard)
  @HttpCode(200)
  @Post('payments/:id/mock-complete')
  async mockComplete(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MockGatewayDto,
  ) {
    return {
      message: 'Mock complete completed successfully',
      result: await this.payments.mockComplete(
        id,
        user.id,
        dto.success,
        dto.walletNumber,
      ),
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Post('reviews')
  async review(@CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    return {
      message: 'Review completed successfully',
      result: await this.orders.createReview(user.id, dto),
    };
  }

  @Get('reviews')
  async reviews(@Query() q: ReviewQueryDto) {
    return {
      message: 'Orders fetched successfully',
      result: await this.orders.listReviews(
        { shopId: q.shopId, productId: q.productId },
        q,
      ),
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Post('returns')
  async createReturn(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateReturnDto,
  ) {
    return {
      message: 'Order created successfully',
      result: await this.orders.createReturn(user.id, dto),
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Get('returns')
  async myReturns(@CurrentUser() user: AuthUser, @Query() q: CursorQueryDto) {
    return {
      message: 'Orders fetched successfully',
      result: await this.orders.customerReturns(user.id, q),
    };
  }
}
