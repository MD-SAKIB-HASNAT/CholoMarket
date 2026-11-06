import { ForbiddenException, Injectable } from '@nestjs/common';
import type { MarketRole, PlatformRole, ShopRole } from 'src/database/enums';
import { PostgresService } from 'src/database/postgres/postgres.service';

/** Platform roles that may act on any shop or market (support/ops tooling). */
const OVERRIDE_ROLES: PlatformRole[] = ['super_admin', 'ops'];

/**
 * Who is who: a user's power comes from membership rows (platform_staff, shop_members, market_members).
 * The RolesGuard asks the `has…` methods; services use the member lookups.
 */
@Injectable()
export class AccessService {
  constructor(private readonly postgresService: PostgresService) {}

  async platformRole(userId: number): Promise<PlatformRole | null> {
    const row = await this.postgresService.platformStaff.findOne({
      where: { userId, isActive: true },
    });
    return row?.role ?? null;
  }

  /** Active platform staff with one of `roles` (no roles: any staff). Super admin always passes. */
  async hasPlatformRole(
    userId: number,
    roles: PlatformRole[] = [],
  ): Promise<boolean> {
    const role = await this.platformRole(userId);
    return (
      !!role &&
      (role === 'super_admin' || !roles.length || roles.includes(role))
    );
  }

  /** Member of the shop with one of `roles` (no roles: any member). Owners pass; platform ops/super admin override. */
  async hasShopRole(
    userId: number,
    shopId: number,
    roles: ShopRole[] = [],
  ): Promise<boolean> {
    const member = await this.postgresService.shopMembers.findOne({
      where: { userId, shopId, isActive: true },
    });
    if (
      member &&
      (!roles.length || member.role === 'owner' || roles.includes(member.role))
    )
      return true;
    return this.isOverride(userId);
  }

  /** Member of the market with one of `roles` (no roles: any member). Market admins pass; platform ops/super admin override. */
  async hasMarketRole(
    userId: number,
    marketId: number,
    roles: MarketRole[] = [],
  ): Promise<boolean> {
    const member = await this.postgresService.marketMembers.findOne({
      where: { userId, marketId },
    });
    if (
      member &&
      (!roles.length || member.role === 'admin' || roles.includes(member.role))
    )
      return true;
    return this.isOverride(userId);
  }

  /** Admin, platform staff, shop team or mall team: these accounts use their panel, not the customer site. */
  async isPanelUser(userId: number): Promise<boolean> {
    const [staff, shop, market] = await Promise.all([
      this.postgresService.platformStaff.exists({
        where: { userId, isActive: true },
      }),
      this.postgresService.shopMembers.exists({
        where: { userId, isActive: true },
      }),
      this.postgresService.marketMembers.exists({ where: { userId } }),
    ]);
    return staff || shop || market;
  }

  /** For services that act inside a shop's data (e.g. a chat thread): throws unless the user belongs to the shop. */
  async requireShopMember(userId: number, shopId: number): Promise<void> {
    if (!(await this.hasShopRole(userId, shopId)))
      throw new ForbiddenException('You are not a member of this shop.');
  }

  isShopMember(userId: number, shopId: number): Promise<boolean> {
    return this.postgresService.shopMembers.exists({
      where: { userId, shopId, isActive: true },
    });
  }

  async shopMemberIds(shopId: number): Promise<number[]> {
    const rows = await this.postgresService.shopMembers.find({
      where: { shopId, isActive: true },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }

  async marketMemberIds(marketId: number): Promise<number[]> {
    const rows = await this.postgresService.marketMembers.find({
      where: { marketId },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }

  private async isOverride(userId: number): Promise<boolean> {
    const role = await this.platformRole(userId);
    return !!role && OVERRIDE_ROLES.includes(role);
  }
}
