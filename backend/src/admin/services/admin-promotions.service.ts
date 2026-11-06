import { Injectable } from '@nestjs/common';
import type {
  BannerInputDto,
  CommissionRuleDto,
  CouponInputDto,
} from 'src/admin/dto/admin-promotions.dto';
import { AuditService } from 'src/admin/services/audit.service';
import {
  inOrder,
  keysetIds,
  toCursorPage,
  type CursorPage,
  type CursorQueryDto,
} from 'src/common/pagination';
import {
  AdCampaign,
  CommissionRule,
  Coupon,
} from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { In } from 'typeorm';

/** What the platform runs to move sales: banners, coupons and the commission rules shops are charged under. */
@Injectable()
export class AdminPromotionsService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly audit: AuditService,
  ) {}

  // ------------------------------------------------------------ banners

  /** Home-page and mall banners, newest first. */
  async listBanners(q: CursorQueryDto): Promise<CursorPage<AdCampaign>> {
    const repo = this.postgresService.dataSource.getRepository(AdCampaign);
    const filter = repo
      .createQueryBuilder('a')
      .where("a.placement IN ('home_banner', 'market_featured')");
    const page = await keysetIds(filter, {
      idExpr: 'a.id',
      keys: [{ expr: 'a.created_at', dir: 'DESC', type: 'timestamptz' }],
      tieDir: 'DESC',
      page: q,
    });
    return toCursorPage(
      inOrder(page.ids, await repo.find({ where: { id: In(page.ids) } })),
      page,
    );
  }

  createBanner(dto: BannerInputDto) {
    return this.postgresService.dataSource.getRepository(AdCampaign).save({
      ...dto,
      placement: dto.placement ?? 'home_banner',
      advertiser: dto.advertiser ?? 'external',
      status: dto.status ?? 'running',
      startsAt: new Date(dto.startsAt),
      endsAt: new Date(dto.endsAt),
    });
  }

  async updateBanner(id: number, dto: Partial<BannerInputDto>) {
    const { startsAt, endsAt, ...rest } = dto;
    await this.postgresService.dataSource.getRepository(AdCampaign).update(id, {
      ...rest,
      ...(startsAt && { startsAt: new Date(startsAt) }),
      ...(endsAt && { endsAt: new Date(endsAt) }),
    });
    return this.postgresService.dataSource
      .getRepository(AdCampaign)
      .findOneByOrFail({ id });
  }

  // ------------------------------------------------------------ coupons

  async listCoupons(q: CursorQueryDto): Promise<CursorPage<Coupon>> {
    const repo = this.postgresService.dataSource.getRepository(Coupon);
    const page = await keysetIds(repo.createQueryBuilder('c'), {
      idExpr: 'c.id',
      keys: [{ expr: 'c.created_at', dir: 'DESC', type: 'timestamptz' }],
      tieDir: 'DESC',
      page: q,
    });
    return toCursorPage(
      inOrder(
        page.ids,
        await repo.find({
          where: { id: In(page.ids) },
          relations: { shop: true, market: true },
        }),
      ),
      page,
    );
  }

  createCoupon(dto: CouponInputDto) {
    return this.postgresService.dataSource.getRepository(Coupon).save({
      ...dto,
      code: dto.code.trim().toUpperCase(),
      startsAt: new Date(dto.startsAt),
      endsAt: new Date(dto.endsAt),
    });
  }

  /** Turns a coupon on or off; answers with the first page of coupons. */
  async toggleCoupon(id: number, isActive: boolean) {
    await this.postgresService.dataSource
      .getRepository(Coupon)
      .update(id, { isActive });
    return this.listCoupons({});
  }

  // ------------------------------------------------------------ commission rules

  /** Newest rule first (rules are never edited; ending one and adding another is the history). */
  async listCommissionRules(
    q: CursorQueryDto,
  ): Promise<CursorPage<CommissionRule>> {
    const repo = this.postgresService.dataSource.getRepository(CommissionRule);
    const page = await keysetIds(repo.createQueryBuilder('r'), {
      idExpr: 'r.id',
      keys: [{ expr: 'r.valid_from', dir: 'DESC', type: 'timestamptz' }],
      tieDir: 'DESC',
      page: q,
    });
    const rules = await repo.find({
      where: { id: In(page.ids) },
      relations: { category: true, market: true, shop: true },
    });
    return toCursorPage(inOrder(page.ids, rules), page);
  }

  async createCommissionRule(dto: CommissionRuleDto, userId: number) {
    const rule = await this.postgresService.dataSource
      .getRepository(CommissionRule)
      .save({
        categoryId: dto.categoryId ?? null,
        marketId: dto.marketId ?? null,
        shopId: dto.shopId ?? null,
        rate: dto.rate,
        validFrom: new Date(dto.validFrom),
        validTo: dto.validTo ? new Date(dto.validTo) : null,
        note: dto.note ?? null,
        createdBy: userId,
      });
    await this.audit.record(
      userId,
      'commission.create',
      'commission_rule',
      rule.id,
      { rate: dto.rate },
    );
    return rule;
  }

  /** Rules are never edited (orders snapshot them); end one and create another. Answers with the first page of rules. */
  async endCommissionRule(id: number, userId: number) {
    await this.postgresService.dataSource
      .getRepository(CommissionRule)
      .update(id, { validTo: new Date() });
    await this.audit.record(userId, 'commission.end', 'commission_rule', id);
    return this.listCommissionRules({});
  }
}
