import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  FloorInputDto,
  MarketInputDto,
  MemberInputDto,
  PickupPointInputDto,
} from 'src/admin/dto/admin-markets.dto';
import { AdminUsersService } from 'src/admin/services/admin-users.service';
import { AuditService } from 'src/admin/services/audit.service';
import { slugify } from 'src/common/helper/util';
import {
  inOrder,
  keysetIds,
  toCursorPage,
  type CursorPage,
  type CursorQueryDto,
} from 'src/common/pagination';
import {
  Market,
  MarketFloor,
  MarketMember,
  PickupPoint,
  Shop,
} from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { GeoService } from 'src/geo/services/geo.service';
import { In } from 'typeorm';

/** Markets as the admin team runs them: the market itself, its floors, pickup desks and team. */
@Injectable()
export class AdminMarketsService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly geo: GeoService,
    private readonly audit: AuditService,
    private readonly users: AdminUsersService,
  ) {}

  /** Newest first, with floors, desks and the full place chain. */
  async list(q: CursorQueryDto): Promise<CursorPage<Market>> {
    const repo = this.postgresService.dataSource.getRepository(Market);
    const page = await keysetIds(repo.createQueryBuilder('m'), {
      idExpr: 'm.id',
      keys: [{ expr: 'm.created_at', dir: 'DESC', type: 'timestamptz' }],
      tieDir: 'DESC',
      page: q,
    });
    const markets = await repo.find({
      where: { id: In(page.ids) },
      relations: {
        area: { district: { division: true } },
        subArea: true,
        floors: true,
        pickupPoints: true,
      },
      order: { floors: { level: 'ASC' } },
    });
    return toCursorPage(inOrder(page.ids, markets), page);
  }

  async get(id: number) {
    const market = await this.postgresService.dataSource
      .getRepository(Market)
      .findOne({
        where: { id },
        relations: {
          area: { district: { division: true } },
          subArea: true,
          floors: true,
          pickupPoints: { floor: true },
        },
        order: { floors: { level: 'ASC' } },
      });
    if (!market) throw new NotFoundException();
    const members = await this.postgresService.dataSource
      .getRepository(MarketMember)
      .find({ where: { marketId: id }, relations: { user: true } });
    return { ...market, members };
  }

  async create(dto: MarketInputDto, userId: number) {
    const repo = this.postgresService.dataSource.getRepository(Market);
    const slug = slugify(dto.slug || dto.nameEn);
    if (await repo.exists({ where: { slug }, withDeleted: true }))
      throw new BadRequestException('That slug is taken.');
    await this.geo.assertAreaAndSubArea(dto.areaId, dto.subAreaId);
    const market = await repo.save({
      ...dto,
      slug,
      status: dto.status ?? 'active',
      createdBy: userId,
    });
    await this.audit.record(userId, 'market.create', 'market', market.id);
    return this.get(market.id);
  }

  async update(id: number, dto: Partial<MarketInputDto>, userId: number) {
    const { slug, ...rest } = dto;
    if (rest.areaId !== undefined || rest.subAreaId !== undefined) {
      const current = await this.postgresService.dataSource
        .getRepository(Market)
        .findOneBy({ id });
      if (!current) throw new NotFoundException();
      const areaId = rest.areaId ?? current.areaId;
      // Moving to another area drops the old sub-area unless a new one is sent.
      const subAreaId =
        rest.subAreaId !== undefined
          ? rest.subAreaId
          : rest.areaId !== undefined && rest.areaId !== current.areaId
            ? null
            : current.subAreaId;
      await this.geo.assertAreaAndSubArea(areaId, subAreaId);
      rest.subAreaId = subAreaId;
    }
    await this.postgresService.dataSource
      .getRepository(Market)
      .update(id, { ...rest, ...(slug && { slug: slugify(slug) }) });
    await this.audit.record(
      userId,
      'market.update',
      'market',
      id,
      rest as Record<string, any>,
    );
    return this.get(id);
  }

  // ------------------------------------------------------------ floors

  async addFloor(marketId: number, dto: FloorInputDto) {
    const repo = this.postgresService.dataSource.getRepository(MarketFloor);
    if (await repo.exists({ where: { marketId, level: dto.level } }))
      throw new BadRequestException('That floor level already exists.');
    await repo.save({ ...dto, marketId });
    return this.get(marketId);
  }

  async updateFloor(floorId: number, dto: Partial<FloorInputDto>) {
    const floor = await this.postgresService.dataSource
      .getRepository(MarketFloor)
      .findOneBy({ id: floorId });
    if (!floor) throw new NotFoundException();
    await this.postgresService.dataSource
      .getRepository(MarketFloor)
      .update(floorId, dto);
    return this.get(floor.marketId);
  }

  async deleteFloor(floorId: number) {
    const floor = await this.postgresService.dataSource
      .getRepository(MarketFloor)
      .findOneBy({ id: floorId });
    if (!floor) throw new NotFoundException();
    if (
      await this.postgresService.dataSource
        .getRepository(Shop)
        .exists({ where: { floorId } })
    )
      throw new BadRequestException('Move the shops on this floor first.');
    await this.postgresService.dataSource
      .getRepository(MarketFloor)
      .delete(floorId);
    return this.get(floor.marketId);
  }

  // ------------------------------------------------------------ pickup desks

  async addPickupPoint(marketId: number, dto: PickupPointInputDto) {
    await this.postgresService.dataSource
      .getRepository(PickupPoint)
      .save({ ...dto, marketId });
    return this.get(marketId);
  }

  async updatePickupPoint(id: number, dto: Partial<PickupPointInputDto>) {
    const point = await this.postgresService.dataSource
      .getRepository(PickupPoint)
      .findOneBy({ id });
    if (!point) throw new NotFoundException();
    await this.postgresService.dataSource
      .getRepository(PickupPoint)
      .update(id, dto);
    return this.get(point.marketId);
  }

  // ------------------------------------------------------------ team

  async addMember(marketId: number, dto: MemberInputDto) {
    const user = await this.users.findOrCreateByPhone(dto.phone, dto.fullName);
    await this.postgresService.dataSource
      .getRepository(MarketMember)
      .upsert({ marketId, userId: user.id, role: dto.role }, [
        'marketId',
        'userId',
      ]);
    return this.get(marketId);
  }

  async removeMember(marketId: number, userId: number) {
    await this.postgresService.dataSource
      .getRepository(MarketMember)
      .delete({ marketId, userId });
    return this.get(marketId);
  }
}
