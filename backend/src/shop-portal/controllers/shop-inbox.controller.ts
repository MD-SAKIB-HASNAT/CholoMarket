import {
  Body,
  Controller,
  Get,
  HttpCode,
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
  type AuthUser,
  CurrentUser,
  Role,
  Roles,
  RolesGuard,
} from 'src/auth';
import { SendMessageDto } from 'src/chat/controllers/chat.controller';
import { ChatService } from 'src/chat/services/chat.service';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';
import { CursorQueryDto } from 'src/common/pagination';
import {
  OfferQueryDto,
  ShopOfferActionDto,
} from 'src/shop-portal/dto/shop-inbox.dto';

/** Customers' price offers and chat messages to the shop. The logic lives in the chat module. */
@ApiTags('shop portal')
@Controller('shop-portal/:shopId')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class ShopInboxController {
  constructor(private readonly chat: ChatService) {}

  @Roles(Role.ShopStaff, Role.ShopManager)
  @Get('offers')
  async offers(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Query() q: OfferQueryDto,
  ) {
    return {
      message: 'Shop portal fetched successfully',
      result: await this.chat.shopOffers(shopId, q, q.status),
    };
  }

  @Roles(Role.ShopManager)
  @HttpCode(200)
  @Post('offers/:id/respond')
  async respondOffer(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Body() dto: ShopOfferActionDto,
  ) {
    return {
      message: 'Respond offer completed successfully',
      result: await this.chat.respondAsShop(
        shopId,
        id,
        user.id,
        dto.action,
        dto.counterPrice,
      ),
    };
  }

  @Roles(Role.ShopStaff, Role.ShopManager)
  @Get('conversations')
  async conversations(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Query() q: CursorQueryDto,
  ) {
    return {
      message: 'Shop portal fetched successfully',
      result: await this.chat.listForShop(shopId, q),
    };
  }

  @Roles(Role.ShopStaff, Role.ShopManager)
  @Post('conversations/:id/messages')
  async reply(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Body() dto: SendMessageDto,
  ) {
    return {
      message: 'Reply completed successfully',
      result: await this.chat.send(id, user.id, dto.body, dto.productId),
    };
  }
}
