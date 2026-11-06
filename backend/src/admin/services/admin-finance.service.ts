import { BadRequestException, Injectable } from '@nestjs/common';
import { AuditService } from 'src/admin/services/audit.service';
import { money } from 'src/common/helper/util';
import {
  inOrder,
  keysetIds,
  toCursorPage,
  type CursorPage,
  type CursorQueryDto,
} from 'src/common/pagination';
import {
  ShopMember,
  ShopPayout,
  ShopPayoutAccount,
} from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { LedgerService } from 'src/orders/services/ledger.service';
import { NotificationsService } from 'src/platform/services/notifications.service';
import { In } from 'typeorm';

export interface ShopBalanceRow {
  shopId: number;
  shopName: string;
  marketName: string | null;
  isVerified: boolean;
  balance: number;
  lastEntryAt: string | null;
  payoutAccount: string | null;
}

/** What the platform owes each shop, and the payouts already made. */
@Injectable()
export class AdminFinanceService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly ledger: LedgerService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  /** Shops with the biggest balance owed first (shop id breaks ties). */
  async balances(q: CursorQueryDto): Promise<CursorPage<ShopBalanceRow>> {
    const filter = this.postgresService.dataSource
      .createQueryBuilder()
      .from('shops', 's')
      .leftJoin('v_shop_balance', 'b', 'b.shop_id = s.id')
      .where('s.deleted_at IS NULL');
    const page = await keysetIds(filter, {
      idExpr: 's.id',
      keys: [{ expr: 'COALESCE(b.balance, 0)', dir: 'DESC', type: 'numeric' }],
      page: q,
    });
    if (!page.ids.length) return toCursorPage([], page);

    const rows = await this.postgresService.dataSource.query<ShopBalanceRow[]>(
      `SELECT s.id AS "shopId", s.name_en AS "shopName", m.name_en AS "marketName", s.is_verified AS "isVerified",
              COALESCE(b.balance, 0)::float AS balance, b.last_entry_at AS "lastEntryAt",
              (SELECT a.method || ' ••••' || right(a.account_number, 4) FROM shop_payout_accounts a WHERE a.shop_id = s.id AND a.is_default) AS "payoutAccount"
       FROM shops s LEFT JOIN v_shop_balance b ON b.shop_id = s.id LEFT JOIN markets m ON m.id = s.market_id
       WHERE s.id = ANY($1)`,
      [page.ids],
    );
    const byId = new Map(rows.map((r) => [r.shopId, r]));
    return toCursorPage(
      page.ids.flatMap((id) => byId.get(id) ?? []),
      page,
    );
  }

  async payouts(q: CursorQueryDto): Promise<CursorPage<ShopPayout>> {
    const repo = this.postgresService.dataSource.getRepository(ShopPayout);
    const page = await keysetIds(repo.createQueryBuilder('p'), {
      idExpr: 'p.id',
      keys: [{ expr: 'p.created_at', dir: 'DESC', type: 'timestamptz' }],
      tieDir: 'DESC',
      page: q,
    });
    return toCursorPage(
      inOrder(
        page.ids,
        await repo.find({
          where: { id: In(page.ids) },
          relations: { shop: true },
        }),
      ),
      page,
    );
  }

  /** Pays a shop what it is owed (never more than its balance) and tells its owners. */
  async createPayout(
    shopId: number,
    amount: number,
    userId: number,
    reference?: string,
  ) {
    const balance = await this.ledger.balance(shopId);
    if (amount > balance)
      throw new BadRequestException(`The shop's balance is only ৳${balance}.`);
    const payout = await this.postgresService.dataSource.transaction(
      async (m) => {
        const account = await m.findOne(ShopPayoutAccount, {
          where: { shopId, isDefault: true },
        });
        const today = new Date().toISOString().slice(0, 10);
        const last = await m.findOne(ShopPayout, {
          where: { shopId },
          order: { createdAt: 'DESC' },
        });
        const p = await m.save(ShopPayout, {
          shopId,
          payoutAccountId: account?.id ?? null,
          amount: money(amount),
          periodStart: last?.periodEnd ?? today,
          periodEnd: today,
          status: 'paid',
          reference: reference ?? null,
          approvedBy: userId,
          paidAt: new Date(),
        });
        await this.ledger.add(m, {
          shopId,
          kind: 'payout',
          amount: -amount,
          payoutId: p.id,
          description: `Payout${reference ? ` ${reference}` : ''}`,
        });
        return p;
      },
    );
    await this.audit.record(userId, 'payout.create', 'shop', shopId, {
      amount,
    });
    this.notifications.notify({
      userIds: (
        await this.postgresService.dataSource
          .getRepository(ShopMember)
          .find({ where: { shopId, role: 'owner' } })
      ).map((member) => member.userId),
      kind: 'payout_sent',
      title: 'Payout sent',
      body: `৳${amount} was sent to your account.`,
      data: { href: `/portal/shop/${shopId}/finance` },
    });
    return payout;
  }
}
