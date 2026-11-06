import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
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
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
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
import { CourierService } from 'src/courier/services/courier.service';
import {
  COURIER_MODES,
  COURIER_PROVIDERS,
  SHIPMENT_STATUSES,
  type ShipmentStatus,
} from 'src/database/enums';

class CourierAccountDto {
  @IsIn(COURIER_PROVIDERS) provider: 'steadfast';
  /** mock = test mode with a simulated courier; live = real bookings with your API keys. */
  @IsIn(COURIER_MODES) mode: 'mock' | 'live';
  @IsOptional() @IsString() @MaxLength(60) label?: string;
  @IsOptional() @IsString() @MaxLength(200) apiKey?: string;
  @IsOptional() @IsString() @MaxLength(200) secretKey?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

class BookShipmentDto {
  @IsOptional() @IsInt() courierAccountId?: number;
  /** Shown to the rider, e.g. "Call before coming". */
  @IsOptional() @IsString() @MaxLength(200) note?: string;
}

class ShipmentQueryDto extends CursorQueryDto {
  @IsOptional() @IsIn([...SHIPMENT_STATUSES, 'open']) status?:
    ShipmentStatus | 'open';
}

class MockStatusDto {
  @IsString() @MaxLength(40) courierStatus: string;
}

@ApiTags('courier delivery')
@Controller()
@UseInterceptors(ResponseInterceptor)
export class CourierController {
  constructor(private readonly courier: CourierService) {}

  // ---------------------------------------------------------------- shop: courier accounts

  // Staff pick the account when sending a parcel; keys are never returned.
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ShopStaff, Role.ShopManager)
  @Get('shop-portal/:shopId/couriers')
  async accounts(@Param('shopId', ParseIntPipe) shopId: number) {
    return {
      message: 'Courier fetched successfully',
      result: await this.courier.listAccounts(shopId),
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ShopOwner)
  @Post('shop-portal/:shopId/couriers')
  async addAccount(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Body() dto: CourierAccountDto,
  ) {
    return {
      message: 'Add account completed successfully',
      result: await this.courier.saveAccount(shopId, dto),
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ShopOwner)
  @Patch('shop-portal/:shopId/couriers/:id')
  async updateAccount(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CourierAccountDto,
  ) {
    return {
      message: 'Courier updated successfully',
      result: await this.courier.saveAccount(shopId, dto, id),
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ShopOwner)
  @HttpCode(200)
  @Post('shop-portal/:shopId/couriers/:id/test')
  async testAccount(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return {
      message: 'Test account completed successfully',
      result: await this.courier.testAccount(shopId, id),
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ShopOwner)
  @Delete('shop-portal/:shopId/couriers/:id')
  async removeAccount(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return {
      message: 'Courier deleted successfully',
      result: await this.courier.removeAccount(shopId, id),
    };
  }

  // ---------------------------------------------------------------- shop: shipments

  /** Hand a home-delivery order to the courier (Steadfast) and mark it shipped. */
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ShopStaff, Role.ShopManager)
  @Post('shop-portal/:shopId/orders/:id/shipment')
  async book(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Body() dto: BookShipmentDto,
  ) {
    return {
      message: 'Book completed successfully',
      result: await this.courier.book(shopId, id, user.id, dto),
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ShopStaff, Role.ShopManager)
  @Get('shop-portal/:shopId/shipments')
  async shipments(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Query() q: ShipmentQueryDto,
  ) {
    return {
      message: 'Courier fetched successfully',
      result: await this.courier.listForShop(shopId, q),
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ShopStaff, Role.ShopManager)
  @HttpCode(200)
  @Post('shop-portal/:shopId/shipments/:id/refresh')
  async refresh(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return {
      message: 'Refresh completed successfully',
      result: await this.courier.refresh(id, shopId),
    };
  }

  /** Test-mode accounts: play the courier (e.g. mark delivered) to try the flow end to end. */
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ShopStaff, Role.ShopManager)
  @HttpCode(200)
  @Post('shop-portal/:shopId/shipments/:id/mock-status')
  async mockStatus(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MockStatusDto,
  ) {
    return {
      message: 'Mock status completed successfully',
      result: await this.courier.mockStatus(shopId, id, dto.courierStatus),
    };
  }

  // ---------------------------------------------------------------- courier → us

  /** Steadfast delivery-status webhook. Configure this URL and a Bearer token in the Steadfast panel. */
  @HttpCode(200)
  @Post('webhooks/steadfast')
  async steadfastWebhook(
    @Headers('authorization') authorization: string | undefined,
    @Body() payload: Record<string, unknown>,
  ) {
    return {
      message: 'Steadfast webhook completed successfully',
      result: await this.courier.webhook(
        authorization,
        payload as Record<string, any>,
      ),
    };
  }

  // ---------------------------------------------------------------- admin

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Staff)
  @Get('admin/shipments')
  async allShipments(@Query() q: ShipmentQueryDto) {
    return {
      message: 'Courier fetched successfully',
      result: await this.courier.listAll(q),
    };
  }
}
