import { REFUND_STATUSES, inList } from 'src/database/enums';
import {
  CreatedAt,
  IdColumn,
  MoneyColumn,
  StatusColumn,
  Timestamp,
} from 'src/database/postgres/columns';
import { ReturnRequest } from 'src/database/postgres/entities/aftersale/return-request.entity';
import { ShopOrder } from 'src/database/postgres/entities/order/shop-order.entity';
import { Payment } from 'src/database/postgres/entities/payment/payment.entity';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

@Entity('refunds')
@Check('CHK_refunds_status', inList('status', REFUND_STATUSES))
@Check('CHK_refunds_amount', '"amount" > 0')
export class Refund {
  @IdColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  paymentId: number;

  @ManyToOne(() => Payment)
  @JoinColumn({ name: 'payment_id' })
  payment: Relation<Payment>;

  @Column({ type: 'int', nullable: true })
  shopOrderId: number | null;

  @ManyToOne(() => ShopOrder)
  @JoinColumn({ name: 'shop_order_id' })
  shopOrder: Relation<ShopOrder> | null;

  @Column({ type: 'int', nullable: true })
  returnRequestId: number | null;

  @ManyToOne(() => ReturnRequest)
  @JoinColumn({ name: 'return_request_id' })
  returnRequest: Relation<ReturnRequest> | null;

  @MoneyColumn()
  amount: number;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @StatusColumn('pending', 15)
  status: string;

  @Column({ type: 'text', nullable: true })
  gatewayRefundId: string | null;

  @Column({ type: 'int', nullable: true })
  processedBy: number | null;

  @Timestamp()
  processedAt: Date | null;

  @CreatedAt()
  createdAt: Date;
}
