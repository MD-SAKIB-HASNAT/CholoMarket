import {
  Body,
  Controller,
  Delete,
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
import { AddMemberDto } from 'src/shop-portal/dto/shop-team.dto';
import { ShopTeamService } from 'src/shop-portal/services/shop-team.service';

/** Managers see the team; only the owner changes who is on it. */
@ApiTags('shop portal')
@Controller('shop-portal/:shopId')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class ShopTeamController {
  constructor(private readonly team: ShopTeamService) {}

  @Roles(Role.ShopManager)
  @Get('members')
  async list(@Param('shopId', ParseIntPipe) shopId: number) {
    return {
      message: 'Shop portal fetched successfully',
      result: await this.team.list(shopId),
    };
  }

  @Roles(Role.ShopOwner)
  @Post('members')
  async add(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Body() dto: AddMemberDto,
  ) {
    return {
      message: 'Shop portal created successfully',
      result: await this.team.add(shopId, dto),
    };
  }

  @Roles(Role.ShopOwner)
  @Delete('members/:userId')
  async remove(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return {
      message: 'Shop portal deleted successfully',
      result: await this.team.remove(shopId, userId),
    };
  }
}
