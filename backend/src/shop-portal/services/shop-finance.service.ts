import { Injectable } from '@nestjs/common';
import { ShopPayout, ShopPayoutAccount } from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { LedgerService } from 'src/orders/services/ledger.service';
import type { PayoutAccountDto } from 'src/shop-portal/dto/shop-finance.dto';

const mask = (accountNumber: string) => `••••${accountNumber.slice(-4)}`;

/** What the platform owes the shop, past payouts and where to pay them. */
@Injectable()
export class ShopFinanceService {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly ledger: LedgerService,
  ) {}

  async payoutInfo(shopId: number) {
    const [accounts, payouts, statement] = await Promise.all([
      this.postgresService.shopPayoutAccounts.find({
        where: { shopId },
        order: { createdAt: 'DESC' },
      }),
      this.postgresService.dataSource
        .getRepository(ShopPayout)
        .find({ where: { shopId }, order: { createdAt: 'DESC' }, take: 50 }),
      this.ledger.statement(shopId),
    ]);
    // Show only the last digits of saved accounts.
    return {
      accounts: accounts.map((a) => ({
        ...a,
        accountNumber: mask(a.accountNumber),
      })),
      payouts,
      ...statement,
    };
  }

  addPayoutAccount(shopId: number, dto: PayoutAccountDto) {
    return this.postgresService.dataSource.transaction(async (m) => {
      const hasDefault = await m.exists(ShopPayoutAccount, {
        where: { shopId, isDefault: true },
      });
      const makeDefault = dto.isDefault || !hasDefault;
      if (makeDefault)
        await m.update(ShopPayoutAccount, { shopId }, { isDefault: false });
      const account = await m.save(ShopPayoutAccount, {
        ...dto,
        shopId,
        isDefault: makeDefault,
      });
      return { ...account, accountNumber: mask(account.accountNumber) };
    });
  }
}
