import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CategoryInputDto,
  UpdateCategoryDto,
} from 'src/admin/dto/admin-categories.dto';
import { AdminCategoriesService } from 'src/admin/services/admin-categories.service';
import { AuthGuard, Role, Roles, RolesGuard } from 'src/auth';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';

@ApiTags('admin')
@Controller('admin/categories')
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(ResponseInterceptor)
@Roles(Role.Staff)
export class AdminCategoriesController {
  constructor(private readonly categories: AdminCategoriesService) {}

  @Get()
  async all() {
    return {
      message: 'Categories fetched successfully',
      result: await this.categories.all(),
    };
  }

  @Roles(Role.Ops)
  @Post()
  async create(@Body() dto: CategoryInputDto) {
    return {
      message: 'Category created successfully',
      result: await this.categories.create(dto),
    };
  }

  @Roles(Role.Ops)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return {
      message: 'Category updated successfully',
      result: await this.categories.update(id, dto),
    };
  }
}
