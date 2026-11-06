import { Module } from '@nestjs/common';
import { ChatModule } from 'src/chat/chat.module';
import { OrdersModule } from 'src/orders/orders.module';
import { ShopAfterSaleController } from 'src/shop-portal/controllers/shop-after-sale.controller';
import { ShopDashboardController } from 'src/shop-portal/controllers/shop-dashboard.controller';
import { ShopFinanceController } from 'src/shop-portal/controllers/shop-finance.controller';
import { ShopImportsController } from 'src/shop-portal/controllers/shop-imports.controller';
import { ShopInboxController } from 'src/shop-portal/controllers/shop-inbox.controller';
import { ShopOrdersController } from 'src/shop-portal/controllers/shop-orders.controller';
import { ShopProductsController } from 'src/shop-portal/controllers/shop-products.controller';
import { ShopSettingsController } from 'src/shop-portal/controllers/shop-settings.controller';
import { ShopTeamController } from 'src/shop-portal/controllers/shop-team.controller';
import { ImportsProcessor } from 'src/shop-portal/processors/imports.processor';
import { ShopDashboardService } from 'src/shop-portal/services/shop-dashboard.service';
import { ShopFinanceService } from 'src/shop-portal/services/shop-finance.service';
import { ShopImportsService } from 'src/shop-portal/services/shop-imports.service';
import { ShopOrdersService } from 'src/shop-portal/services/shop-orders.service';
import { ShopProductsService } from 'src/shop-portal/services/shop-products.service';
import { ShopSettingsService } from 'src/shop-portal/services/shop-settings.service';
import { ShopTeamService } from 'src/shop-portal/services/shop-team.service';

/**
 * The shop owner / manager / staff app, one folder per domain. Every route is under `shop-portal/:shopId`
 * and guarded by `@Roles(Role.Shop…)`: owners can do everything, managers run the shop, staff handle
 * orders, stock and chat.
 */
@Module({
  imports: [OrdersModule, ChatModule],
  controllers: [
    ShopDashboardController,
    ShopProductsController,
    ShopImportsController,
    ShopOrdersController,
    ShopInboxController,
    ShopAfterSaleController,
    ShopSettingsController,
    ShopFinanceController,
    ShopTeamController,
  ],
  providers: [
    ShopDashboardService,
    ShopProductsService,
    ShopImportsService,
    ImportsProcessor,
    ShopOrdersService,
    ShopSettingsService,
    ShopFinanceService,
    ShopTeamService,
  ],
})
export class ShopPortalModule {}
