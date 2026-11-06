import { BadRequestException, Injectable } from '@nestjs/common';
import type { CategoryInputDto } from 'src/admin/dto/admin-categories.dto';
import { slugify } from 'src/common/helper/util';
import { PostgresService } from 'src/database/postgres/postgres.service';

/** The category tree, including hidden categories (the small fixed list, so it is not paged). */
@Injectable()
export class AdminCategoriesService {
  constructor(private readonly postgresService: PostgresService) {}

  all() {
    return this.postgresService.categories.find({
      order: { sortOrder: 'ASC', nameEn: 'ASC' },
    });
  }

  async create(dto: CategoryInputDto) {
    const slug = slugify(dto.slug || dto.nameEn);
    if (await this.postgresService.categories.exists({ where: { slug } }))
      throw new BadRequestException('That slug is taken.');
    return this.postgresService.categories.save({ ...dto, slug });
  }

  async update(id: number, dto: Partial<CategoryInputDto>) {
    const { slug, ...rest } = dto;
    await this.postgresService.categories.update(id, {
      ...rest,
      ...(slug && { slug: slugify(slug) }),
    });
    return this.postgresService.categories.findOneByOrFail({ id });
  }
}
