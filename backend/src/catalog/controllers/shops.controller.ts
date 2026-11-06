import {
  Controller,
  Delete,
  Get,
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
  CurrentUser,
  OptionalAuthGuard,
  Role,
  Roles,
  RolesGuard,
  type AuthUser,
} from 'src/auth';
import { ShopQueryDto } from 'src/catalog/dto/shops.dto';
import { ShopFollowsService } from 'src/catalog/services/shop-follows.service';
import { ShopsService } from 'src/catalog/services/shops.service';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';
import { CursorQueryDto } from 'src/common/pagination';

@ApiTags('shops')
@Controller()
@UseInterceptors(ResponseInterceptor)
export class ShopsController {
  constructor(
    private readonly shops: ShopsService,
    private readonly follows: ShopFollowsService,
  ) {}

  /** Shops by place or nearby, best first. Cursor-paged. */
  @Get('shops')
  async list(@Query() q: ShopQueryDto) {
    return {
      message: 'Shops fetched successfully',
      result: await this.shops.list(q),
    };
  }

  @UseGuards(OptionalAuthGuard)
  @Get('shops/:slug')
  async one(@Param('slug') slug: string, @CurrentUser() user?: AuthUser) {
    return {
      message: 'Shops fetched successfully',
      result: await this.shops.bySlug(slug, user?.id),
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.Customer)
  @Post('shops/:id/follow')
  async follow(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      message: 'Follow completed successfully',
      result: await this.follows.follow(user.id, id),
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Delete('shops/:id/follow')
  async unfollow(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      message: 'Shop deleted successfully',
      result: await this.follows.unfollow(user.id, id),
    };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Get('me/following')
  async following(@CurrentUser() user: AuthUser, @Query() q: CursorQueryDto) {
    return {
      message: 'Shops fetched successfully',
      result: await this.follows.listFor(user.id, q),
    };
  }
}
