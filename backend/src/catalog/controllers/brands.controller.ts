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
import { ApiTags, PartialType } from '@nestjs/swagger';
import { AuthGuard, Role, Roles, RolesGuard } from 'src/auth';
import { BrandInputDto, BrandQueryDto } from 'src/catalog/dto/brands.dto';
import { BrandsService } from 'src/catalog/services/brands.service';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';

class UpdateBrandDto extends PartialType(BrandInputDto) {}

/** The brand filter on the product list: brands that have products on sale. */
@ApiTags('brands')
@Controller('brands')
@UseInterceptors(ResponseInterceptor)
export class BrandsController {
  constructor(private readonly brands: BrandsService) {}

  @Get()
  async list(@Query() q: BrandQueryDto) {
    return {
      message: 'Brands fetched successfully',
      result: await this.brands.list(q, true),
    };
  }
}

/** Brand catalogue for the admin team: every brand, whether or not it has products yet. */
@ApiTags('admin')
@Controller('admin/brands')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
@Roles(Role.Staff)
export class BrandsAdminController {
  constructor(private readonly brands: BrandsService) {}

  @Get()
  async list(@Query() q: BrandQueryDto) {
    return {
      message: 'Brands fetched successfully',
      result: await this.brands.list(q, false),
    };
  }

  @Roles(Role.Ops, Role.Onboarding)
  @Post()
  async create(@Body() dto: BrandInputDto) {
    return {
      message: 'Brand created successfully',
      result: await this.brands.create(dto),
    };
  }

  @Roles(Role.Ops, Role.Onboarding)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBrandDto,
  ) {
    return {
      message: 'Brand updated successfully',
      result: await this.brands.update(id, dto),
    };
  }

  @Roles(Role.Ops, Role.Onboarding)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return {
      message: 'Brand deleted successfully',
      result: await this.brands.remove(id),
    };
  }
}
