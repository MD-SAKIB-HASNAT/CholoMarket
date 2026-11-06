import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  keysetIds,
  toCursorPage,
  type CursorPage,
} from 'src/common/pagination';
import { Area, AuditLog, SubArea } from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import type { GeoInputDto, GeoListQueryDto } from 'src/geo/dto/geo.dto';
import {
  ENTITY,
  GEO_LEVELS,
  LABEL,
  LEVEL_QUERY,
  PARENT_COLUMN,
  PARENT_ENTITY,
  PARENT_LABEL,
  type GeoLevel,
} from 'src/geo/helpers/geo-levels';
import { QueryFailedError } from 'typeorm';

type GeoRow = Record<string, any>;

@Injectable()
export class GeoService {
  constructor(private readonly postgresService: PostgresService) {}

  // ------------------------------------------------------------ public pickers (active rows only)

  divisions() {
    return this.postgresService.dataSource.query(
      `SELECT id, name_en AS "nameEn", name_bn AS "nameBn" FROM divisions WHERE is_active ORDER BY name_en`,
    );
  }

  districts(divisionId?: number) {
    return this.postgresService.dataSource.query(
      `SELECT id, division_id AS "divisionId", name_en AS "nameEn", name_bn AS "nameBn" FROM districts
       WHERE is_active AND ($1::int IS NULL OR division_id = $1) ORDER BY name_en`,
      [divisionId ?? null],
    );
  }

  areas(districtId?: number) {
    return this.postgresService.dataSource.query(
      `SELECT id, district_id AS "districtId", name_en AS "nameEn", name_bn AS "nameBn", kind FROM areas
       WHERE is_active AND ($1::int IS NULL OR district_id = $1) ORDER BY name_en`,
      [districtId ?? null],
    );
  }

  subAreas(areaId?: number) {
    return this.postgresService.dataSource.query(
      `SELECT id, area_id AS "areaId", name_en AS "nameEn", name_bn AS "nameBn" FROM sub_areas
       WHERE is_active AND ($1::int IS NULL OR area_id = $1) ORDER BY name_en`,
      [areaId ?? null],
    );
  }

  // ------------------------------------------------------------ admin CRUD

  /** One level, in name order within its parents, cursor-paged. Filters: q (either name) and the ancestor ids. */
  async list(level: GeoLevel, q: GeoListQueryDto): Promise<CursorPage<GeoRow>> {
    const spec = LEVEL_QUERY[level];
    const filter = spec.from(
      this.postgresService.dataSource.createQueryBuilder(),
    );
    if (q.q)
      filter.andWhere('(x.name_en ILIKE :like OR x.name_bn ILIKE :like)', {
        like: `%${q.q.replace(/[%_\\]/g, '\\$&')}%`,
      });
    for (const key of ['divisionId', 'districtId', 'areaId'] as const) {
      const column = spec.filters[key];
      if (column && q[key] !== undefined)
        filter.andWhere(`${column} = :${key}`, { [key]: q[key] });
    }
    const page = await keysetIds(filter, {
      idExpr: 'x.id',
      keys: spec.keys,
      page: q,
    });

    const rows = page.ids.length ? await this.rows(level, page.ids) : [];
    const byId = new Map(rows.map((r) => [Number(r.id), r]));
    return toCursorPage(
      page.ids.flatMap((id) => byId.get(id) ?? []),
      page,
    );
  }

  private rows(level: GeoLevel, ids: number[]): Promise<GeoRow[]> {
    const spec = LEVEL_QUERY[level];
    return spec
      .from(this.postgresService.dataSource.createQueryBuilder())
      .select(spec.select)
      .where('x.id IN (:...ids)', { ids })
      .getRawMany<GeoRow>();
  }

  private async one(level: GeoLevel, id: number): Promise<GeoRow> {
    const [row] = await this.rows(level, [id]);
    if (!row)
      throw new NotFoundException(`That ${LABEL[level]} does not exist.`);
    return row;
  }

  async create(level: GeoLevel, dto: GeoInputDto, actorId: number) {
    const nameEn = dto.nameEn?.trim();
    const nameBn = dto.nameBn?.trim();
    if (!nameEn || !nameBn)
      throw new BadRequestException('Enter the name in English and in Bangla.');
    const row: Record<string, unknown> = {
      nameEn,
      nameBn,
      isActive: dto.isActive ?? true,
    };
    const parentColumn = PARENT_COLUMN[level];
    if (parentColumn) {
      if (!dto.parentId)
        throw new BadRequestException(
          `Choose the ${PARENT_LABEL[level]} it belongs to.`,
        );
      await this.assertParent(level, dto.parentId);
      row[parentColumn] = dto.parentId;
    }
    if (level === 'areas')
      Object.assign(row, {
        kind: dto.kind ?? 'thana',
        isServiceable: dto.isServiceable ?? false,
      });
    const inserted = await this.guard(level, nameEn, () =>
      this.postgresService.dataSource
        .createQueryBuilder()
        .insert()
        .into(ENTITY[level])
        .values(row)
        .returning('id')
        .execute(),
    );
    const id = inserted.raw[0].id as number;
    await this.audit(actorId, `geo.${level}.create`, id, row);
    return this.one(level, id);
  }

  async update(level: GeoLevel, id: number, dto: GeoInputDto, actorId: number) {
    await this.one(level, id);
    const changes: Record<string, unknown> = {};
    if (dto.nameEn !== undefined) {
      if (!dto.nameEn.trim())
        throw new BadRequestException('The English name cannot be empty.');
      changes.nameEn = dto.nameEn.trim();
    }
    if (dto.nameBn !== undefined) {
      if (!dto.nameBn.trim())
        throw new BadRequestException('The Bangla name cannot be empty.');
      changes.nameBn = dto.nameBn.trim();
    }
    if (dto.isActive !== undefined) changes.isActive = dto.isActive;
    const parentColumn = PARENT_COLUMN[level];
    if (parentColumn && dto.parentId !== undefined) {
      await this.assertParent(level, dto.parentId);
      changes[parentColumn] = dto.parentId;
    }
    if (level === 'areas') {
      if (dto.kind !== undefined) changes.kind = dto.kind;
      if (dto.isServiceable !== undefined)
        changes.isServiceable = dto.isServiceable;
    }
    if (Object.keys(changes).length) {
      await this.guard(level, String(changes.nameEn ?? ''), () =>
        this.postgresService.dataSource
          .createQueryBuilder()
          .update(ENTITY[level])
          .set(changes)
          .where('id = :id', { id })
          .execute(),
      );
      await this.audit(actorId, `geo.${level}.update`, id, changes);
    }
    return this.one(level, id);
  }

  async remove(level: GeoLevel, id: number, actorId: number) {
    const row = await this.one(level, id);
    const children = Number(row.childCount);
    const markets = Number(row.marketCount);
    if (children)
      throw new BadRequestException(
        `"${row.nameEn}" still has ${children} ${LABEL[GEO_LEVELS[GEO_LEVELS.indexOf(level) + 1]]}${children > 1 ? 's' : ''}. Remove or move them first.`,
      );
    if (markets)
      throw new BadRequestException(
        `${markets} market${markets > 1 ? 's are' : ' is'} located in "${row.nameEn}". Move ${markets > 1 ? 'them' : 'it'} first.`,
      );
    try {
      await this.postgresService.dataSource
        .createQueryBuilder()
        .delete()
        .from(ENTITY[level])
        .where('id = :id', { id })
        .execute();
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === '23503'
      ) {
        throw new BadRequestException(
          `"${row.nameEn}" is still in use (for example in saved customer addresses). Hide it instead.`,
        );
      }
      throw err;
    }
    await this.audit(actorId, `geo.${level}.delete`, id, {
      nameEn: row.nameEn,
    });
    return { deleted: true };
  }

  // ------------------------------------------------------------ helpers

  /** Used by the market form: the area/sub-area pair must be consistent. */
  async assertAreaAndSubArea(areaId: number, subAreaId?: number | null) {
    const area = await this.postgresService.dataSource
      .getRepository(Area)
      .findOneBy({ id: areaId });
    if (!area) throw new BadRequestException('That area does not exist.');
    if (subAreaId) {
      const sub = await this.postgresService.dataSource
        .getRepository(SubArea)
        .findOneBy({ id: subAreaId });
      if (!sub || sub.areaId !== areaId)
        throw new BadRequestException(
          'That sub-area is not part of the chosen area.',
        );
    }
  }

  private async assertParent(level: GeoLevel, parentId: number) {
    const parent = PARENT_ENTITY[level as keyof typeof PARENT_ENTITY];
    if (
      !(await this.postgresService.dataSource
        .getRepository(parent as never)
        .exists({ where: { id: parentId } as never }))
    ) {
      throw new BadRequestException(
        `That ${PARENT_LABEL[level]} does not exist.`,
      );
    }
  }

  /** Turns the unique-name violation into a readable message. */
  private async guard<T>(
    level: GeoLevel,
    name: string,
    run: () => Promise<T>,
  ): Promise<T> {
    try {
      return await run();
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === '23505'
      ) {
        throw new BadRequestException(
          `A ${LABEL[level]} named "${name}" already exists${PARENT_LABEL[level] ? ` in this ${PARENT_LABEL[level]}` : ''}.`,
        );
      }
      throw err;
    }
  }

  private audit(
    actorId: number,
    action: string,
    entityId: number,
    changes: Record<string, unknown>,
  ) {
    return this.postgresService.dataSource.getRepository(AuditLog).insert({
      actorId,
      action,
      entityType: 'geo',
      entityId,
      changes: changes as Record<string, any>,
    });
  }
}
