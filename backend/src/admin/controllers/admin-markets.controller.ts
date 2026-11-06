import {
  Body,
  Controller,
  Delete,
  Get,
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
  FloorInputDto,
  MarketInputDto,
  MemberInputDto,
  PickupPointInputDto,
  UpdateFloorDto,
  UpdateMarketDto,
  UpdatePickupPointDto,
} from 'src/admin/dto/admin-markets.dto';
import { AdminMarketsService } from 'src/admin/services/admin-markets.service';
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

/** Markets, their floors, pickup desks and management team. */
@ApiTags('admin')
@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
@Roles(Role.Staff)
export class AdminMarketsController {
  constructor(private readonly markets: AdminMarketsService) {}

  @Get('markets')
  async list(@Query() q: CursorQueryDto) {
    return {
      message: 'Data fetched successfully',
      result: await this.markets.list(q),
    };
  }

  @Get('markets/:id')
  async one(@Param('id', ParseIntPipe) id: number) {
    return {
      message: 'Data fetched successfully',
      result: await this.markets.get(id),
    };
  }

  @Roles(Role.Ops, Role.Onboarding)
  @Post('markets')
  async create(@Body() dto: MarketInputDto, @CurrentUser() user: AuthUser) {
    return {
      message: 'Data created successfully',
      result: await this.markets.create(dto, user.id),
    };
  }

  @Roles(Role.Ops, Role.Onboarding)
  @Patch('markets/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMarketDto,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      message: 'Data updated successfully',
      result: await this.markets.update(id, dto, user.id),
    };
  }

  // ------------------------------------------------ floors
  @Roles(Role.Ops, Role.Onboarding)
  @Post('markets/:id/floors')
  async addFloor(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FloorInputDto,
  ) {
    return {
      message: 'Add floor completed successfully',
      result: await this.markets.addFloor(id, dto),
    };
  }

  @Roles(Role.Ops, Role.Onboarding)
  @Patch('floors/:id')
  async updateFloor(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFloorDto,
  ) {
    return {
      message: 'Data updated successfully',
      result: await this.markets.updateFloor(id, dto),
    };
  }

  @Roles(Role.Ops, Role.Onboarding)
  @Delete('floors/:id')
  async deleteFloor(@Param('id', ParseIntPipe) id: number) {
    return {
      message: 'Data deleted successfully',
      result: await this.markets.deleteFloor(id),
    };
  }

  // ------------------------------------------------ pickup desks
  @Roles(Role.Ops, Role.Onboarding)
  @Post('markets/:id/pickup-points')
  async addPickupPoint(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PickupPointInputDto,
  ) {
    return {
      message: 'Add pickup point completed successfully',
      result: await this.markets.addPickupPoint(id, dto),
    };
  }

  @Roles(Role.Ops, Role.Onboarding)
  @Patch('pickup-points/:id')
  async updatePickupPoint(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePickupPointDto,
  ) {
    return {
      message: 'Data updated successfully',
      result: await this.markets.updatePickupPoint(id, dto),
    };
  }

  // ------------------------------------------------ team
  @Roles(Role.Ops)
  @Post('markets/:id/members')
  async addMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MemberInputDto,
  ) {
    return {
      message: 'Add member completed successfully',
      result: await this.markets.addMember(id, dto),
    };
  }

  @Roles(Role.Ops)
  @Delete('markets/:id/members/:userId')
  async removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return {
      message: 'Data deleted successfully',
      result: await this.markets.removeMember(id, userId),
    };
  }
}
