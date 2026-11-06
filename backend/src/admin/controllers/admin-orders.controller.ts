import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminOrderQueryDto } from 'src/admin/dto/admin-orders.dto';
import { AdminOrdersService } from 'src/admin/services/admin-orders.service';
import { AuthGuard, Role, Roles, RolesGuard } from 'src/auth';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';

@ApiTags('admin')
@Controller('admin/orders')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
@Roles(Role.Staff)
export class AdminOrdersController {
  constructor(private readonly orders: AdminOrdersService) {}

  @Get()
  async list(@Query() q: AdminOrderQueryDto) {
    return {
      message: 'Orders fetched successfully',
      result: await this.orders.list(q),
    };
  }

  @Get(':orderNo')
  async detail(@Param('orderNo') orderNo: string) {
    return {
      message: 'Orders fetched successfully',
      result: await this.orders.detail(orderNo),
    };
  }
}
