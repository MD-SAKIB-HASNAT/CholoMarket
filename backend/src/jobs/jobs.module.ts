import { Module } from '@nestjs/common';
import { ChatModule } from 'src/chat/chat.module';
import { CourierModule } from 'src/courier/courier.module';
import { MaintenanceProcessor } from 'src/jobs/processors/maintenance.processor';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [OrdersModule, ChatModule, CourierModule],
  providers: [MaintenanceProcessor],
})
export class JobsModule {}
