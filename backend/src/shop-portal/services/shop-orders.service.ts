import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderWorkflowService } from 'src/orders/services/order-workflow.service';
import { OrdersService } from 'src/orders/services/orders.service';
import type {
  ShopOrderActionDto,
  ShopOrderQueryDto,
} from 'src/shop-portal/dto/shop-orders.dto';

/** The shop's side of an order: look at it, then confirm, ready, hand over or reject it. */
@Injectable()
export class ShopOrdersService {
  constructor(
    private readonly orders: OrdersService,
    private readonly workflow: OrderWorkflowService,
  ) {}

  list(shopId: number, q: ShopOrderQueryDto) {
    return this.orders.listForShop(shopId, q);
  }

  detail(shopId: number, id: number) {
    return this.orders.shopOrderDetail(shopId, id);
  }

  /** confirm -> ready -> complete (with the customer's pickup code), or reject. */
  async act(
    shopId: number,
    id: number,
    actorId: number,
    dto: ShopOrderActionDto,
  ) {
    await this.detail(shopId, id); // 404 unless it belongs to this shop
    if (dto.action === 'reject' && !dto.reason)
      throw new BadRequestException('Tell the customer why.');
    if (dto.action === 'complete' && !dto.pickupCode)
      throw new BadRequestException('Enter the customer’s pickup code.');
    await this.workflow.apply(id, dto.action, {
      actorId,
      reason: dto.reason,
      pickupCode: dto.pickupCode,
    });
    return this.detail(shopId, id);
  }
}
