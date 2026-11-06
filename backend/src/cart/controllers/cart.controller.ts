import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  AuthGuard,
  type AuthUser,
  CurrentUser,
  Role,
  Roles,
  RolesGuard,
} from 'src/auth';
import { CartService } from 'src/cart/services/cart.service';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';

class AddCartItemDto {
  @IsInt()
  variantId: number;

  @IsInt()
  @Min(1)
  @Max(50)
  quantity: number;

  /** Accepted bargaining offer to apply. */
  @IsOptional()
  @IsInt()
  offerId?: number;
}

class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  @Max(50)
  quantity: number;
}

@ApiTags('cart')
@ApiBearerAuth()
@Controller('cart')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
@Roles(Role.Customer)
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  async view(@CurrentUser() user: AuthUser) {
    return {
      message: 'Cart fetched successfully',
      result: await this.cart.view(user.id),
    };
  }

  @Post('items')
  async add(@CurrentUser() user: AuthUser, @Body() dto: AddCartItemDto) {
    return {
      message: 'Cart created successfully',
      result: await this.cart.add(
        user.id,
        dto.variantId,
        dto.quantity,
        dto.offerId,
      ),
    };
  }

  @Patch('items/:id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCartItemDto,
  ) {
    return {
      message: 'Cart updated successfully',
      result: await this.cart.update(user.id, id, dto.quantity),
    };
  }

  @Delete('items/:id')
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return {
      message: 'Cart deleted successfully',
      result: await this.cart.remove(user.id, id),
    };
  }

  @Delete()
  async clear(@CurrentUser() user: AuthUser) {
    return {
      message: 'Cart deleted successfully',
      result: await this.cart.clear(user.id),
    };
  }
}
