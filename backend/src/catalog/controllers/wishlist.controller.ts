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
  Role,
  Roles,
  RolesGuard,
  type AuthUser,
} from 'src/auth';
import { WishlistService } from 'src/catalog/services/wishlist.service';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';
import { CursorQueryDto } from 'src/common/pagination';

@ApiTags('wishlist')
@Controller('wishlist')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() q: CursorQueryDto) {
    return {
      message: 'Wishlist fetched successfully',
      result: await this.wishlist.list(user.id, q),
    };
  }

  @Roles(Role.Customer)
  @Post(':productId')
  async add(
    @Param('productId', ParseIntPipe) productId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      message: 'Wishlist created successfully',
      result: await this.wishlist.add(user.id, productId),
    };
  }

  @Delete(':productId')
  async remove(
    @Param('productId', ParseIntPipe) productId: number,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      message: 'Wishlist deleted successfully',
      result: await this.wishlist.remove(user.id, productId),
    };
  }
}
