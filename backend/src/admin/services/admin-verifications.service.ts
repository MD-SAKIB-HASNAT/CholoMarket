import { Injectable, NotFoundException } from '@nestjs/common';
import type { VerificationQueryDto } from 'src/admin/dto/admin-verifications.dto';
import { AuditService } from 'src/admin/services/audit.service';
import {
  inOrder,
  keysetIds,
  toCursorPage,
  type CursorPage,
} from 'src/common/pagination';
import { Shop, ShopVerification } from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { In } from 'typeorm';

/**
 * The verified badge: a shop earns it with an approved trade licence AND an approved visit from the field team.
 * This is the review queue and the visit record that decide it.
 */
@Injectable()
export class AdminVerificationsService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly audit: AuditService,
  ) {}

  /** Documents with a given status (pending by default), oldest first so nothing waits forever. */
  async list(q: VerificationQueryDto): Promise<CursorPage<ShopVerification>> {
    const repo =
      this.postgresService.dataSource.getRepository(ShopVerification);
    const filter = repo
      .createQueryBuilder('v')
      .where('v.status = :status', { status: q.status ?? 'pending' });
    const page = await keysetIds(filter, {
      idExpr: 'v.id',
      keys: [{ expr: 'v.created_at', dir: 'ASC', type: 'timestamptz' }],
      page: q,
    });
    const rows = await repo.find({
      where: { id: In(page.ids) },
      relations: { shop: { market: true } },
    });
    return toCursorPage(inOrder(page.ids, rows), page);
  }

  async review(
    id: number,
    status: 'approved' | 'rejected',
    userId: number,
    notes?: string,
  ) {
    const repo =
      this.postgresService.dataSource.getRepository(ShopVerification);
    const verification = await repo.findOneBy({ id });
    if (!verification) throw new NotFoundException();
    Object.assign(verification, {
      status,
      notes: notes ?? verification.notes,
      reviewedBy: userId,
      reviewedAt: new Date(),
    });
    await repo.save(verification);
    await this.refreshBadge(verification.shopId, userId);
    return verification;
  }

  /** Record that the field team visited the shop in person. */
  async recordVisit(shopId: number, userId: number, notes?: string) {
    await this.postgresService.dataSource.getRepository(ShopVerification).save({
      shopId,
      kind: 'physical_visit',
      status: 'approved',
      reviewedBy: userId,
      reviewedAt: new Date(),
      notes: notes ?? null,
    });
    await this.refreshBadge(shopId, userId);
  }

  /** Badge = approved trade licence AND approved physical visit. */
  private async refreshBadge(shopId: number, userId: number) {
    const approved = await this.postgresService.dataSource
      .getRepository(ShopVerification)
      .find({ where: { shopId, status: 'approved' } });
    const kinds = new Set(approved.map((a) => a.kind));
    const verified = kinds.has('trade_license') && kinds.has('physical_visit');
    const shop = await this.postgresService.dataSource
      .getRepository(Shop)
      .findOneByOrFail({ id: shopId });
    if (shop.isVerified !== verified) {
      await this.postgresService.dataSource.getRepository(Shop).update(shopId, {
        isVerified: verified,
        verifiedAt: verified ? new Date() : null,
      });
      await this.audit.record(
        userId,
        verified ? 'shop.verify' : 'shop.unverify',
        'shop',
        shopId,
      );
    }
  }
}
