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
  OnboardShopDto,
  ShopQueryDto,
  SubscriptionDto,
  UpdateShopDto,
} from 'src/admin/dto/admin-shops.dto';
import {
  PhysicalVisitDto,
  ReviewVerificationDto,
  VerificationQueryDto,
} from 'src/admin/dto/admin-verifications.dto';
import { AdminShopsService } from 'src/admin/services/admin-shops.service';
import { AdminVerificationsService } from 'src/admin/services/admin-verifications.service';
import {
  AuthGuard,
  type AuthUser,
  CurrentUser,
  Role,
  Roles,
  RolesGuard,
} from 'src/auth';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';

/** Shops, their plans and the badge (verification) queue. */
@ApiTags('admin')
@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
@Roles(Role.Staff)
export class AdminShopsController {
  constructor(
    private readonly shops: AdminShopsService,
    private readonly verifications: AdminVerificationsService,
  ) {}

  @Get('shops')
  async list(@Query() q: ShopQueryDto) {
    return {
      message: 'Data fetched successfully',
      result: await this.shops.list(q),
    };
  }

  @Get('shops/:id')
  async one(@Param('id', ParseIntPipe) id: number) {
    return {
      message: 'Data fetched successfully',
      result: await this.shops.get(id),
    };
  }

  @Roles(Role.Ops, Role.Onboarding)
  @Post('shops')
  async onboard(@Body() dto: OnboardShopDto, @CurrentUser() user: AuthUser) {
    return {
      message: 'Onboard completed successfully',
      result: await this.shops.onboard(dto, user.id),
    };
  }

  @Roles(Role.Ops, Role.Onboarding)
  @Patch('shops/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateShopDto,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      message: 'Data updated successfully',
      result: await this.shops.update(id, dto, user.id),
    };
  }

  @Roles(Role.Ops, Role.Onboarding)
  @Post('shops/:id/visit')
  async visit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PhysicalVisitDto,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      message: 'Visit completed successfully',
      result: await this.shops.recordVisit(id, user.id, dto.notes),
    };
  }

  @Roles(Role.Finance, Role.Ops)
  @Post('shops/:id/subscription')
  async subscription(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubscriptionDto,
  ) {
    return {
      message: 'Subscription completed successfully',
      result: await this.shops.setSubscription(id, dto.planCode),
    };
  }

  @Get('plans')
  async plans() {
    return {
      message: 'Data fetched successfully',
      result: await this.shops.listPlans(),
    };
  }

  // ------------------------------------------------ verified badge
  @Get('verifications')
  async verificationQueue(@Query() q: VerificationQueryDto) {
    return {
      message: 'Data fetched successfully',
      result: await this.verifications.list(q),
    };
  }

  @Roles(Role.Ops, Role.Onboarding)
  @HttpCode(200)
  @Post('verifications/:id/review')
  async review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewVerificationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      message: 'Review completed successfully',
      result: await this.verifications.review(
        id,
        dto.status,
        user.id,
        dto.notes,
      ),
    };
  }
}
