import { Module } from '@nestjs/common';
import { OrdersController } from 'src/orders/controllers/orders.controller';
import { CheckoutService } from 'src/orders/services/checkout.service';
import { InventoryService } from 'src/orders/services/inventory.service';
import { LedgerService } from 'src/orders/services/ledger.service';
import { OrderWorkflowService } from 'src/orders/services/order-workflow.service';
import { OrdersService } from 'src/orders/services/orders.service';
import { PaymentsService } from 'src/orders/services/payments.service';

@Module({
  controllers: [OrdersController],
  providers: [
    CheckoutService,
    InventoryService,
    LedgerService,
    OrderWorkflowService,
    OrdersService,
    PaymentsService,
  ],
  exports: [
    InventoryService,
    LedgerService,
    OrderWorkflowService,
    OrdersService,
  ],
})
export class OrdersModule {}
