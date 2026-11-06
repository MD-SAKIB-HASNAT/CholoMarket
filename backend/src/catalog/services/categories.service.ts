import { Injectable, NotFoundException } from '@nestjs/common';
import { PostgresService } from 'src/database/postgres/postgres.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly postgresService: PostgresService) {}

  /** The whole (small, fixed) category tree: top-level categories with their children. */
  async tree() {
    const all = await this.postgresService.categories.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', nameEn: 'ASC' },
    });
    return all
      .filter((c) => !c.parentId)
      .map((root) => ({
        ...root,
        children: all.filter((c) => c.parentId === root.id),
      }));
  }

  async bySlug(slug: string) {
    const category = await this.postgresService.categories.findOne({
      where: { slug },
      relations: { parent: true, children: true },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  /** The category plus all of its descendants, so filtering by "Fashion" includes "Men", "Women"… */
  async withDescendants(categoryId: number): Promise<number[]> {
    const all = await this.postgresService.categories.find({
      select: { id: true, parentId: true },
    });
    const ids = [categoryId];
    for (let i = 0; i < ids.length; i++) {
      for (const c of all) if (c.parentId === ids[i]) ids.push(c.id);
    }
    return ids;
  }
}
