import { Module } from '@nestjs/common';
import { AdminCategoriesController } from 'src/admin/controllers/admin-categories.controller';
import { AdminFinanceController } from 'src/admin/controllers/admin-finance.controller';
import { AdminInsightsController } from 'src/admin/controllers/admin-insights.controller';
import { AdminMarketsController } from 'src/admin/controllers/admin-markets.controller';
import { AdminOrdersController } from 'src/admin/controllers/admin-orders.controller';
import { AdminPromotionsController } from 'src/admin/controllers/admin-promotions.controller';
import { AdminSettingsController } from 'src/admin/controllers/admin-settings.controller';
import { AdminShopsController } from 'src/admin/controllers/admin-shops.controller';
import { AdminUsersController } from 'src/admin/controllers/admin-users.controller';
import { AdminCategoriesService } from 'src/admin/services/admin-categories.service';
import { AdminFinanceService } from 'src/admin/services/admin-finance.service';
import { AdminInsightsService } from 'src/admin/services/admin-insights.service';
import { AdminMarketsService } from 'src/admin/services/admin-markets.service';
import { AdminOrdersService } from 'src/admin/services/admin-orders.service';
import { AdminPromotionsService } from 'src/admin/services/admin-promotions.service';
import { AdminSettingsService } from 'src/admin/services/admin-settings.service';
import { AdminShopsService } from 'src/admin/services/admin-shops.service';
import { AdminUsersService } from 'src/admin/services/admin-users.service';
import { AdminVerificationsService } from 'src/admin/services/admin-verifications.service';
import { AuditService } from 'src/admin/services/audit.service';
import { GeoModule } from 'src/geo/geo.module';
import { OrdersModule } from 'src/orders/orders.module';

/** The admin console API, one controller + service per domain (all under /admin, platform staff only). */
@Module({
  imports: [OrdersModule, GeoModule],
  controllers: [
    AdminCategoriesController,
    AdminFinanceController,
    AdminInsightsController,
    AdminMarketsController,
    AdminOrdersController,
    AdminPromotionsController,
    AdminSettingsController,
    AdminShopsController,
    AdminUsersController,
  ],
  providers: [
    AuditService,
    AdminCategoriesService,
    AdminFinanceService,
    AdminInsightsService,
    AdminMarketsService,
    AdminOrdersService,
    AdminPromotionsService,
    AdminSettingsService,
    AdminShopsService,
    AdminUsersService,
    AdminVerificationsService,
  ],
})
export class AdminModule {}
