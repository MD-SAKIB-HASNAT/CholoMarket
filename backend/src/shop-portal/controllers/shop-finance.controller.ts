import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard, Role, Roles, RolesGuard } from 'src/auth';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';
import { PayoutAccountDto } from 'src/shop-portal/dto/shop-finance.dto';
import { ShopFinanceService } from 'src/shop-portal/services/shop-finance.service';

/** Managers see the money; only the owner chooses where it is paid. */
@ApiTags('shop portal')
@Controller('shop-portal/:shopId')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class ShopFinanceController {
  constructor(private readonly finance: ShopFinanceService) {}

  @Roles(Role.ShopManager)
  @Get('finance')
  async overview(@Param('shopId', ParseIntPipe) shopId: number) {
    return {
      message: 'Shop portal fetched successfully',
      result: await this.finance.payoutInfo(shopId),
    };
  }

  @Roles(Role.ShopOwner)
  @Post('payout-accounts')
  async addPayoutAccount(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Body() dto: PayoutAccountDto,
  ) {
    return {
      message: 'Add payout account completed successfully',
      result: await this.finance.addPayoutAccount(shopId, dto),
    };
  }
}
