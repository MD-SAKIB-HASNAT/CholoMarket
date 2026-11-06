import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  BannerInputDto,
  CommissionRuleDto,
  CouponInputDto,
  ToggleCouponDto,
  UpdateBannerDto,
} from 'src/admin/dto/admin-promotions.dto';
import { AdminPromotionsService } from 'src/admin/services/admin-promotions.service';
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

/** Commission rules, home banners and coupons. */
@ApiTags('admin')
@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
@Roles(Role.Staff)
export class AdminPromotionsController {
  constructor(private readonly promotions: AdminPromotionsService) {}

  // ------------------------------------------------ commission rules
  @Get('commission-rules')
  async commissionRules(@Query() q: CursorQueryDto) {
    return {
      message: 'Data fetched successfully',
      result: await this.promotions.listCommissionRules(q),
    };
  }

  @Roles(Role.Finance)
  @Post('commission-rules')
  async createRule(
    @Body() dto: CommissionRuleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      message: 'Data created successfully',
      result: await this.promotions.createCommissionRule(dto, user.id),
    };
  }

  @Roles(Role.Finance)
  @HttpCode(200)
  @Post('commission-rules/:id/end')
  async endRule(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      message: 'End rule completed successfully',
      result: await this.promotions.endCommissionRule(id, user.id),
    };
  }

  // ------------------------------------------------ banners
  @Get('banners')
  async banners(@Query() q: CursorQueryDto) {
    return {
      message: 'Data fetched successfully',
      result: await this.promotions.listBanners(q),
    };
  }

  @Roles(Role.Ops)
  @Post('banners')
  async createBanner(@Body() dto: BannerInputDto) {
    return {
      message: 'Data created successfully',
      result: await this.promotions.createBanner(dto),
    };
  }

  @Roles(Role.Ops)
  @Patch('banners/:id')
  async updateBanner(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBannerDto,
  ) {
    return {
      message: 'Data updated successfully',
      result: await this.promotions.updateBanner(id, dto),
    };
  }

  // ------------------------------------------------ coupons
  @Get('coupons')
  async coupons(@Query() q: CursorQueryDto) {
    return {
      message: 'Data fetched successfully',
      result: await this.promotions.listCoupons(q),
    };
  }

  @Roles(Role.Ops, Role.Finance)
  @Post('coupons')
  async createCoupon(@Body() dto: CouponInputDto) {
    return {
      message: 'Data created successfully',
      result: await this.promotions.createCoupon(dto),
    };
  }

  @Roles(Role.Ops, Role.Finance)
  @Patch('coupons/:id')
  async toggleCoupon(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ToggleCouponDto,
  ) {
    return {
      message: 'Toggle coupon completed successfully',
      result: await this.promotions.toggleCoupon(id, dto.isActive),
    };
  }
}
