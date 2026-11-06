import { Module } from '@nestjs/common';
import { CourierController } from 'src/courier/controllers/courier.controller';
import { CourierService } from 'src/courier/services/courier.service';
import { OrdersModule } from 'src/orders/orders.module';

/** Third-party courier delivery (Steadfast now; Pathao, RedX next). */
@Module({
  imports: [OrdersModule],
  controllers: [CourierController],
  providers: [CourierService],
  exports: [CourierService],
})
export class CourierModule {}
