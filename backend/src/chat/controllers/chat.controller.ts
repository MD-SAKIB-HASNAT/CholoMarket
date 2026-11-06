import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  AuthGuard,
  type AuthUser,
  CurrentUser,
  Role,
  Roles,
  RolesGuard,
} from 'src/auth';
import { ChatService } from 'src/chat/services/chat.service';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';
import { CursorQueryDto } from 'src/common/pagination';

class StartConversationDto {
  @IsInt()
  shopId: number;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body: string;

  @IsOptional()
  @IsInt()
  productId?: number;
}

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body: string;

  @IsOptional()
  @IsInt()
  productId?: number;
}

class MakeOfferDto {
  @IsInt()
  variantId: number;

  @IsInt()
  @Min(1)
  @Max(20)
  quantity: number;

  /** Per-unit price the customer proposes. */
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  offeredPrice: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

class CustomerOfferActionDto {
  @IsIn(['accept_counter', 'decline_counter', 'withdraw'])
  action: 'accept_counter' | 'decline_counter' | 'withdraw';
}

@ApiTags('chat & offers')
@ApiBearerAuth()
@Controller()
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('conversations')
  async list(@CurrentUser() user: AuthUser, @Query() q: CursorQueryDto) {
    return {
      message: 'Chat fetched successfully',
      result: await this.chat.listForCustomer(user.id, q),
    };
  }

  @Post('conversations')
  async start(
    @CurrentUser() user: AuthUser,
    @Body() dto: StartConversationDto,
  ) {
    return {
      message: 'Start completed successfully',
      result: await this.chat.start(
        user.id,
        dto.shopId,
        dto.body,
        dto.productId,
      ),
    };
  }

  /** Works for both the customer and the shop's staff. */
  @Get('conversations/:id')
  async thread(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return {
      message: 'Chat fetched successfully',
      result: await this.chat.thread(id, user.id),
    };
  }

  @Post('conversations/:id/messages')
  async send(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendMessageDto,
  ) {
    return {
      message: 'Send completed successfully',
      result: await this.chat.send(id, user.id, dto.body, dto.productId),
    };
  }

  @Get('offers')
  async myOffers(@CurrentUser() user: AuthUser, @Query() q: CursorQueryDto) {
    return {
      message: 'Chat fetched successfully',
      result: await this.chat.customerOffers(user.id, q),
    };
  }

  /** "Make an offer" on a negotiable product. */
  @Roles(Role.Customer)
  @Post('offers')
  async makeOffer(@CurrentUser() user: AuthUser, @Body() dto: MakeOfferDto) {
    return {
      message: 'Make offer completed successfully',
      result: await this.chat.makeOffer(
        user.id,
        dto.variantId,
        dto.quantity,
        dto.offeredPrice,
        dto.note,
      ),
    };
  }

  @Post('offers/:id/respond')
  async respond(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CustomerOfferActionDto,
  ) {
    return {
      message: 'Respond completed successfully',
      result: await this.chat.respondAsCustomer(id, user.id, dto.action),
    };
  }
}
