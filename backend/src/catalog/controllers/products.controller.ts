import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, OptionalAuthGuard, type AuthUser } from 'src/auth';
import { ProductQueryDto } from 'src/catalog/dto/products.dto';
import { ProductsService } from 'src/catalog/services/products.service';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';

@ApiTags('products')
@Controller('products')
@UseInterceptors(ResponseInterceptor)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  /** Search by name, filter by category and brand, optionally nearby. Cursor-paged. */
  @Get()
  async list(@Query() q: ProductQueryDto) {
    return {
      message: 'Products fetched successfully',
      result: await this.products.list(q),
    };
  }

  @UseGuards(OptionalAuthGuard)
  @Get(':id')
  async one(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user?: AuthUser,
  ) {
    return {
      message: 'Products fetched successfully',
      result: await this.products.byId(id, user?.id),
    };
  }
}
