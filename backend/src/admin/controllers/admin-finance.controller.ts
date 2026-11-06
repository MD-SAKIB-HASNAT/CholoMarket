import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PayoutDto } from 'src/admin/dto/admin-finance.dto';
import { AdminFinanceService } from 'src/admin/services/admin-finance.service';
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

/** Balances owed to shops and the payouts made. Finance team only (the super admin passes everything). */
@ApiTags('admin')
@Controller('admin/finance')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
@Roles(Role.Finance)
export class AdminFinanceController {
  constructor(private readonly finance: AdminFinanceService) {}

  @Get('balances')
  async balances(@Query() q: CursorQueryDto) {
    return {
      message: 'Finance fetched successfully',
      result: await this.finance.balances(q),
    };
  }

  @Get('payouts')
  async payouts(@Query() q: CursorQueryDto) {
    return {
      message: 'Finance fetched successfully',
      result: await this.finance.payouts(q),
    };
  }

  @Post('payouts')
  async createPayout(@Body() dto: PayoutDto, @CurrentUser() user: AuthUser) {
    return {
      message: 'Finance created successfully',
      result: await this.finance.createPayout(
        dto.shopId,
        dto.amount,
        user.id,
        dto.reference,
      ),
    };
  }
}
