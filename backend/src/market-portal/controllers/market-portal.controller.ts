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
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  AuthGuard,
  CurrentUser,
  Role,
  Roles,
  RolesGuard,
  type AuthUser,
} from 'src/auth';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';
import { CursorQueryDto } from 'src/common/pagination';
import {
  MarketPortalService,
  type DeskOrderFilter,
} from 'src/market-portal/services/market-portal.service';
import { PickupCodeDto } from 'src/orders/dto/orders.dto';
import { OrderWorkflowService } from 'src/orders/services/order-workflow.service';

class DeskOrderQueryDto extends CursorQueryDto {
  @IsOptional()
  @IsIn(['active', 'completed', 'all'])
  status?: DeskOrderFilter;
}

class MarketProfileDto {
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsUrl({ require_tld: false }) logoUrl?: string;
  @IsOptional() @IsUrl({ require_tld: false }) coverUrl?: string;
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) opensAt?: string;
  @IsOptional() @Matches(/^\d{2}:\d{2}$/) closesAt?: string;
}

/** Mall / market management and pickup-desk staff. */
@ApiTags('market portal')
@Controller('market-portal/:marketId')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class MarketPortalController {
  constructor(
    private readonly portal: MarketPortalService,
    private readonly workflow: OrderWorkflowService,
  ) {}

  @Roles(Role.MarketManager, Role.MarketDeskStaff)
  @Get('dashboard')
  async dashboard(@Param('marketId', ParseIntPipe) marketId: number) {
    return {
      message: 'Market portal fetched successfully',
      result: await this.portal.dashboard(marketId),
    };
  }

  @Roles(Role.MarketManager, Role.MarketDeskStaff)
  @Get('shops')
  async shops(
    @Param('marketId', ParseIntPipe) marketId: number,
    @Query() q: CursorQueryDto,
  ) {
    return {
      message: 'Market portal fetched successfully',
      result: await this.portal.shops(marketId, q),
    };
  }

  /** Orders the customer chose to collect at this market's pickup desk. */
  @Roles(Role.MarketManager, Role.MarketDeskStaff)
  @Get('desk-orders')
  async deskOrders(
    @Param('marketId', ParseIntPipe) marketId: number,
    @Query() q: DeskOrderQueryDto,
  ) {
    return {
      message: 'Market portal fetched successfully',
      result: await this.portal.deskOrders(marketId, q),
    };
  }

  @Roles(Role.MarketManager, Role.MarketDeskStaff)
  @HttpCode(200)
  @Post('desk-orders/:id/complete')
  async completeDesk(
    @Param('marketId', ParseIntPipe) marketId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Body() dto: PickupCodeDto,
  ) {
    return {
      message: 'Complete desk completed successfully',
      result: await this.workflow.completeAtDesk(
        marketId,
        id,
        dto.pickupCode,
        user.id,
      ),
    };
  }

  @Roles(Role.MarketAdmin)
  @Patch('profile')
  async profile(
    @Param('marketId', ParseIntPipe) marketId: number,
    @Body() dto: MarketProfileDto,
  ) {
    return {
      message: 'Profile completed successfully',
      result: await this.portal.updateProfile(marketId, dto),
    };
  }

  @Roles(Role.MarketAdmin)
  @Get('members')
  async members(
    @Param('marketId', ParseIntPipe) marketId: number,
    @Query() q: CursorQueryDto,
  ) {
    return {
      message: 'Market portal fetched successfully',
      result: await this.portal.members(marketId, q),
    };
  }
}
