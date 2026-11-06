import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, PartialType } from '@nestjs/swagger';
import { AuthGuard, type AuthUser, CurrentUser, RolesGuard } from 'src/auth';
import { AddressesService } from 'src/auth/services/addresses.service';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';
import { AddressInputDto } from 'src/orders/dto/orders.dto';

class UpdateAddressDto extends PartialType(AddressInputDto) {}

/** The customer's saved delivery addresses. */
@ApiTags('auth')
@ApiBearerAuth()
@Controller('me/addresses')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    return {
      message: 'Addresses fetched successfully',
      result: await this.addressesService.list(user.id),
    };
  }

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: AddressInputDto) {
    return {
      message: 'Address created successfully',
      result: await this.addressesService.create(user.id, dto),
    };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAddressDto,
  ) {
    return {
      message: 'Address updated successfully',
      result: await this.addressesService.update(user.id, id, dto),
    };
  }

  @HttpCode(200)
  @Post(':id/default')
  async makeDefault(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return {
      message: 'Default address updated successfully',
      result: await this.addressesService.makeDefault(user.id, id),
    };
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return {
      message: 'Address deleted successfully',
      result: await this.addressesService.remove(user.id, id),
    };
  }
}
