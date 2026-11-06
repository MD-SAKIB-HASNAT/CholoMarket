import { Injectable } from '@nestjs/common';
import { money } from 'src/common/helper/util';
import type { LedgerKind } from 'src/database/enums';
import { ShopLedgerEntry } from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import type { EntityManager } from 'typeorm';

/**
 * What the platform owes each shop. Balance = SUM(amount); positive = owed to the shop.
 * Cash the shop collects itself never enters the ledger, only the commission on it.
 */
@Injectable()
export class LedgerService {
  constructor(private readonly postgresService: PostgresService) {}

  async add(
    m: EntityManager,
    entry: {
      shopId: number;
      kind: LedgerKind;
      amount: number;
      shopOrderId?: number;
      refundId?: number;
      payoutId?: number;
      description?: string;
    },
  ) {
    const amount = money(entry.amount);
    if (amount === 0) return;
    await m.insert(ShopLedgerEntry, {
      shopId: entry.shopId,
      kind: entry.kind,
      amount,
      shopOrderId: entry.shopOrderId ?? null,
      refundId: entry.refundId ?? null,
      payoutId: entry.payoutId ?? null,
      description: entry.description ?? null,
    });
  }

  async balance(shopId: number): Promise<number> {
    const row = await this.postgresService.shopLedgerEntries
      .createQueryBuilder('e')
      .select('COALESCE(SUM(e.amount), 0)', 'balance')
      .where('e.shop_id = :shopId', { shopId })
      .getRawOne<{ balance: string }>();
    return Number(row?.balance ?? 0);
  }

  async statement(shopId: number, limit = 100) {
    const [entries, balance] = await Promise.all([
      this.postgresService.shopLedgerEntries.find({
        where: { shopId },
        relations: { shopOrder: true },
        order: { createdAt: 'DESC' },
        take: limit,
      }),
      this.balance(shopId),
    ]);
    return { balance, entries };
  }
}
