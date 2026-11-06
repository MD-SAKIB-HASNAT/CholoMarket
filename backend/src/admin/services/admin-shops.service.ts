import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  OnboardShopDto,
  ShopQueryDto,
  UpdateShopDto,
} from 'src/admin/dto/admin-shops.dto';
import { AdminUsersService } from 'src/admin/services/admin-users.service';
import { AdminVerificationsService } from 'src/admin/services/admin-verifications.service';
import { AuditService } from 'src/admin/services/audit.service';
import { normalizeBdPhone, slugify } from 'src/common/helper/util';
import {
  inOrder,
  keysetIds,
  toCursorPage,
  type CursorPage,
} from 'src/common/pagination';
import {
  Market,
  MarketFloor,
  Shop,
  ShopCategory,
  ShopMember,
  ShopSubscription,
  ShopVerification,
  SubscriptionPlan,
} from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { LedgerService } from 'src/orders/services/ledger.service';
import { NotificationsService } from 'src/platform/services/notifications.service';
import { In } from 'typeorm';

/** Shops for the onboarding team: sign-up, edits, the field visit and the plan a shop is on. */
@Injectable()
export class AdminShopsService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly ledger: LedgerService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
    private readonly users: AdminUsersService,
    private readonly verifications: AdminVerificationsService,
  ) {}

  /** Newest first; filter by status, market or a name / shop-number search. */
  async list(q: ShopQueryDto): Promise<CursorPage<Shop>> {
    const repo = this.postgresService.dataSource.getRepository(Shop);
    const filter = repo.createQueryBuilder('s');
    if (q.status) filter.andWhere('s.status = :status', { status: q.status });
    if (q.marketId)
      filter.andWhere('s.market_id = :marketId', { marketId: q.marketId });
    if (q.q)
      filter.andWhere(
        "(s.name_en || ' ' || coalesce(s.name_bn, '') || ' ' || coalesce(s.shop_number, '')) ILIKE :q",
        { q: `%${q.q}%` },
      );
    const page = await keysetIds(filter, {
      idExpr: 's.id',
      keys: [{ expr: 's.created_at', dir: 'DESC', type: 'timestamptz' }],
      tieDir: 'DESC',
      page: q,
    });

    const shops = await repo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.market', 'm')
      .leftJoinAndSelect('s.floor', 'f')
      .leftJoinAndSelect('s.primaryCategory', 'pc')
      .leftJoinAndSelect('s.members', 'mem', "mem.role = 'owner'")
      .leftJoinAndSelect('mem.user', 'owner')
      .where('s.id IN (:...ids)', { ids: page.ids.length ? page.ids : [0] })
      .getMany();
    return toCursorPage(inOrder(page.ids, shops), page);
  }

  async get(id: number) {
    const shop = await this.postgresService.dataSource
      .getRepository(Shop)
      .findOne({
        where: { id },
        relations: {
          market: { floors: true },
          floor: true,
          primaryCategory: true,
          members: { user: true },
          categories: { category: true },
        },
      });
    if (!shop) throw new NotFoundException();
    const [verifications, subscription, balance] = await Promise.all([
      this.postgresService.dataSource
        .getRepository(ShopVerification)
        .find({ where: { shopId: id }, order: { createdAt: 'DESC' } }),
      this.postgresService.dataSource.getRepository(ShopSubscription).findOne({
        where: { shopId: id, status: In(['trial', 'active', 'past_due']) },
        relations: { plan: true },
      }),
      this.ledger.balance(id),
    ]);
    return { ...shop, verifications, subscription, balance };
  }

  /** The onboarding team signs a shop up on the spot, creating the owner's account if needed. */
  async onboard(dto: OnboardShopDto, userId: number) {
    const market = await this.postgresService.dataSource
      .getRepository(Market)
      .findOneBy({ id: dto.marketId });
    if (!market) throw new BadRequestException('Unknown market.');
    if (
      dto.floorId &&
      !(await this.postgresService.dataSource
        .getRepository(MarketFloor)
        .exists({ where: { id: dto.floorId, marketId: market.id } }))
    ) {
      throw new BadRequestException('That floor is not in this market.');
    }
    const owner = await this.users.findOrCreateByPhone(
      dto.ownerPhone,
      dto.ownerName,
    );
    const shopId = await this.postgresService.dataSource.transaction(
      async (m) => {
        let slug = slugify(`${dto.nameEn}-${market.slug}`).slice(0, 70);
        for (
          let i = 2;
          await m.exists(Shop, { where: { slug }, withDeleted: true });
          i++
        )
          slug = `${slugify(`${dto.nameEn}-${market.slug}`).slice(0, 66)}-${i}`;
        const shop = await m.save(Shop, {
          slug,
          marketId: market.id,
          floorId: dto.floorId ?? null,
          shopNumber: dto.shopNumber ?? null,
          walkOrder: dto.walkOrder ?? null,
          nameEn: dto.nameEn,
          nameBn: dto.nameBn ?? null,
          description: dto.description ?? null,
          primaryCategoryId: dto.primaryCategoryId,
          phone: dto.phone ? normalizeBdPhone(dto.phone) : owner.phone,
          status: dto.status ?? 'active',
          onboardedBy: userId,
        });
        await m.insert(ShopMember, {
          shopId: shop.id,
          userId: owner.id,
          role: 'owner',
        });
        const categoryIds = [
          ...new Set([dto.primaryCategoryId, ...(dto.categoryIds ?? [])]),
        ];
        await m.insert(
          ShopCategory,
          categoryIds.map((categoryId) => ({ shopId: shop.id, categoryId })),
        );
        const free = await m.findOne(SubscriptionPlan, {
          where: { code: 'free' },
        });
        if (free)
          await m.insert(ShopSubscription, {
            shopId: shop.id,
            planId: free.id,
            status: 'active',
            startsAt: new Date(),
          });
        return shop.id;
      },
    );
    await this.audit.record(userId, 'shop.onboard', 'shop', shopId);
    this.notifications.notify({
      userIds: [owner.id],
      kind: 'shop_onboarded',
      title: `Welcome! ${dto.nameEn} is now on the platform`,
      body: 'Open the shop dashboard to add products and manage orders.',
      data: { href: `/portal/shop/${shopId}` },
      channels: ['in_app', 'sms'],
    });
    return this.get(shopId);
  }

  async update(id: number, dto: UpdateShopDto, userId: number) {
    const res = await this.postgresService.dataSource
      .getRepository(Shop)
      .update(id, dto);
    if (!res.affected) throw new NotFoundException();
    await this.audit.record(
      userId,
      'shop.update',
      'shop',
      id,
      dto as Record<string, any>,
    );
    return this.get(id);
  }

  /** The field team visited in person: counts towards the verified badge. */
  async recordVisit(shopId: number, userId: number, notes?: string) {
    await this.verifications.recordVisit(shopId, userId, notes);
    return this.get(shopId);
  }

  // ------------------------------------------------------------ plans

  listPlans() {
    return this.postgresService.dataSource
      .getRepository(SubscriptionPlan)
      .find({ order: { monthlyPrice: 'ASC' } });
  }

  async setSubscription(shopId: number, planCode: string) {
    const plan = await this.postgresService.dataSource
      .getRepository(SubscriptionPlan)
      .findOne({ where: { code: planCode } });
    if (!plan) throw new BadRequestException('Unknown plan.');
    await this.postgresService.dataSource.transaction(async (m) => {
      await m.update(
        ShopSubscription,
        { shopId, status: In(['trial', 'active', 'past_due']) },
        { status: 'cancelled', endsAt: new Date() },
      );
      await m.insert(ShopSubscription, {
        shopId,
        planId: plan.id,
        status: 'active',
        startsAt: new Date(),
      });
    });
    return this.get(shopId);
  }
}
