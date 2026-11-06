import { Injectable } from '@nestjs/common';
import { money } from 'src/common/helper/util';
import { CommissionRule } from 'src/database/postgres/entities';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { In, IsNull, LessThanOrEqual, MoreThan } from 'typeorm';

export interface CommissionContext {
  shopId: number;
  marketId: number | null;
  categoryId: number;
}

/**
 * Picks the most specific active commission rule:
 *   shop (8) > market (4) > exact category (2) > parent category (1) > global (0)
 * then subtracts the shop's subscription-plan discount.
 */
@Injectable()
export class CommissionService {
  constructor(private readonly postgresService: PostgresService) {}

  async activeRules(at = new Date()): Promise<CommissionRule[]> {
    return this.postgresService.commissionRules.find({
      where: [
        { validFrom: LessThanOrEqual(at), validTo: IsNull() },
        { validFrom: LessThanOrEqual(at), validTo: MoreThan(at) },
      ],
    });
  }

  /** Returns rate in percent for each context (same order). */
  async ratesFor(
    contexts: CommissionContext[],
    at = new Date(),
  ): Promise<number[]> {
    const [rules, cats] = await Promise.all([
      this.activeRules(at),
      this.postgresService.categories.find(),
    ]);
    const parentOf = new Map(cats.map((c) => [c.id, c.parentId]));
    const shopIds = [...new Set(contexts.map((c) => c.shopId))];
    const subs = shopIds.length
      ? await this.postgresService.shopSubscriptions.find({
          where: { shopId: In(shopIds), status: In(['trial', 'active']) },
          relations: { plan: true },
        })
      : [];
    const planDiscount = new Map(
      subs.map((s) => [s.shopId, s.plan.commissionDiscount]),
    );

    return contexts.map((ctx) => {
      const ancestors = new Set<number>();
      let p = parentOf.get(ctx.categoryId) ?? null;
      while (p) {
        ancestors.add(p);
        p = parentOf.get(p) ?? null;
      }

      let best: { score: number; rule: CommissionRule } | undefined;
      for (const rule of rules) {
        if (rule.shopId && rule.shopId !== ctx.shopId) continue;
        if (rule.marketId && rule.marketId !== ctx.marketId) continue;
        let score = 0;
        if (rule.categoryId) {
          if (rule.categoryId === ctx.categoryId) score += 2;
          else if (ancestors.has(rule.categoryId)) score += 1;
          else continue;
        }
        if (rule.marketId) score += 4;
        if (rule.shopId) score += 8;
        if (
          !best ||
          score > best.score ||
          (score === best.score && rule.validFrom > best.rule.validFrom)
        ) {
          best = { score, rule };
        }
      }
      const base = best?.rule.rate ?? 0;
      return Math.max(0, money(base - (planDiscount.get(ctx.shopId) ?? 0)));
    });
  }
}
