import { Module } from '@nestjs/common';
import { MarketPortalController } from 'src/market-portal/controllers/market-portal.controller';
import { MarketPortalService } from 'src/market-portal/services/market-portal.service';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [MarketPortalController],
  providers: [MarketPortalService],
})
export class MarketPortalModule {}
