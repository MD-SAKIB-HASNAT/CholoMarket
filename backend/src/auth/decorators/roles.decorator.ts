import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

/**
 * Every role a route can ask for.
 *  - Platform roles belong to the admin team and work everywhere.
 *  - Shop roles apply to the shop in the URL (:shopId); owners always pass a shop route.
 *  - Market roles apply to the market in the URL (:marketId); market admins always pass.
 *  - Customer is any account that is not on a panel.
 * The unqualified Staff / ShopMember / MarketMember mean "any role in that team".
 */
export const Role = {
  Staff: 'platform',
  SuperAdmin: 'platform:super_admin',
  Ops: 'platform:ops',
  Onboarding: 'platform:onboarding',
  Support: 'platform:support',
  Finance: 'platform:finance',

  ShopMember: 'shop',
  ShopOwner: 'shop:owner',
  ShopManager: 'shop:manager',
  ShopStaff: 'shop:staff',

  MarketMember: 'market',
  MarketAdmin: 'market:admin',
  MarketManager: 'market:manager',
  MarketDeskStaff: 'market:desk_staff',

  Customer: 'customer',
} as const;

export type RoleName = (typeof Role)[keyof typeof Role];

export const ROLES_KEY = 'roles';

/**
 * Who may call this route (any one of the listed roles). Put it on a controller for all its routes,
 * or on a method to override the controller's roles. Checked by the global RolesGuard.
 *
 *   @Roles(Role.Ops, Role.Onboarding)   // platform ops or onboarding (super admin always passes)
 *   @Roles(Role.ShopManager)            // manager of :shopId (owner passes too)
 *   @Roles(Role.Customer)               // shoppers only
 */
export const Roles = (...roles: RoleName[]) =>
  applyDecorators(SetMetadata(ROLES_KEY, roles), ApiBearerAuth());
