import { ReturnRequest } from 'src/database/postgres/entities/aftersale/return-request.entity';
import { OrderItem } from 'src/database/postgres/entities/order/order-item.entity';
import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';

@Entity('return_items')
@Check('CHK_return_items_qty', '"quantity" > 0')
export class ReturnItem {
  @PrimaryColumn({ type: 'int' })
  returnRequestId: number;

  @PrimaryColumn({ type: 'int' })
  orderItemId: number;

  @ManyToOne(() => ReturnRequest, (r) => r.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'return_request_id' })
  returnRequest: Relation<ReturnRequest>;

  @ManyToOne(() => OrderItem)
  @JoinColumn({ name: 'order_item_id' })
  orderItem: Relation<OrderItem>;

  @Column({ type: 'int' })
  quantity: number;
}
