import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, type RoleName } from 'src/auth/decorators/roles.decorator';
import type { AuthedRequest } from 'src/auth/guards/auth.guard';
import { AccessService } from 'src/auth/services/access.service';
import {
  MARKET_ROLES,
  PLATFORM_ROLES,
  SHOP_ROLES,
  type MarketRole,
  type PlatformRole,
  type ShopRole,
} from 'src/database/enums';

type Scope = 'platform' | 'shop' | 'market' | 'customer';

/** "shop:manager" → ["shop", "manager"]; "platform" → ["platform", undefined]. */
const split = (role: RoleName): [Scope, string | undefined] => {
  const [scope, name] = role.split(':');
  return [scope as Scope, name];
};

/** The part after the colon, narrowed to the scope's own role names. */
const names = <T extends string>(
  roles: RoleName[],
  scope: Scope,
  allowed: readonly T[],
): T[] =>
  roles
    .map(split)
    .filter(
      ([s, n]) =>
        s === scope && n && (allowed as readonly string[]).includes(n),
    )
    .map(([, n]) => n as T);

const routeId = (req: AuthedRequest, param: string): number => {
  const id = Number(req.params[param]);
  if (!Number.isInteger(id) || id <= 0)
    throw new ForbiddenException(`Invalid ${param}.`);
  return id;
};

/**
 * Global guard, second in line (after the AuthGuard): checks the route's @Roles against who the user is.
 * Any one listed role is enough. Routes without @Roles are open to every signed-in user.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly access: AccessService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!roles?.length) return true;

    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const userId = req.user?.id;
    if (!userId) throw new ForbiddenException('Please log in.');

    // Try each team the route names; the first refusal's message is what the caller sees.
    const scopes = [...new Set(roles.map((r) => split(r)[0]))];
    let refusal: string | null = null;
    for (const scope of scopes) {
      const reason = await this.refusal(scope, roles, userId, req);
      if (reason === null) return true;
      refusal ??= reason;
    }
    throw new ForbiddenException(refusal ?? 'You do not have access to this.');
  }

  /** null when the user passes for this scope, otherwise why not. */
  private async refusal(
    scope: Scope,
    roles: RoleName[],
    userId: number,
    req: AuthedRequest,
  ): Promise<string | null> {
    switch (scope) {
      case 'platform': {
        const allowed = names<PlatformRole>(roles, 'platform', PLATFORM_ROLES);
        return (await this.access.hasPlatformRole(userId, allowed))
          ? null
          : 'Admin access required.';
      }
      case 'shop': {
        const allowed = names<ShopRole>(roles, 'shop', SHOP_ROLES);
        return (await this.access.hasShopRole(
          userId,
          routeId(req, 'shopId'),
          allowed,
        ))
          ? null
          : 'You do not have access to this shop.';
      }
      case 'market': {
        const allowed = names<MarketRole>(roles, 'market', MARKET_ROLES);
        return (await this.access.hasMarketRole(
          userId,
          routeId(req, 'marketId'),
          allowed,
        ))
          ? null
          : 'You do not have access to this market.';
      }
      case 'customer':
        return (await this.access.isPanelUser(userId))
          ? 'This account works from its panel. Use a customer account to shop.'
          : null;
    }
  }
}
