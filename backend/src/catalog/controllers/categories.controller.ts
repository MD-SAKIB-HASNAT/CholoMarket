import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoriesService } from 'src/catalog/services/categories.service';
import { ResponseInterceptor } from 'src/common/interceptor/response.interceptor';

@ApiTags('categories')
@Controller('categories')
@UseInterceptors(ResponseInterceptor)
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  async tree() {
    return {
      message: 'Categories fetched successfully',
      result: await this.categories.tree(),
    };
  }

  @Get(':slug')
  async one(@Param('slug') slug: string) {
    return {
      message: 'Categories fetched successfully',
      result: await this.categories.bySlug(slug),
    };
  }
}
