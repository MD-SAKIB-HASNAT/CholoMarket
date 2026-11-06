import { Timestamp } from 'src/database/postgres/columns';
import { Delivery } from 'src/database/postgres/entities/delivery/delivery.entity';
import { ShopOrder } from 'src/database/postgres/entities/order/shop-order.entity';
import {
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';

@Entity('delivery_shop_orders')
export class DeliveryShopOrder {
  @PrimaryColumn({ type: 'int' })
  deliveryId: number;

  @PrimaryColumn({ type: 'int' })
  shopOrderId: number;

  @ManyToOne(() => Delivery, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'delivery_id' })
  delivery: Relation<Delivery>;

  @OneToOne(() => ShopOrder)
  @JoinColumn({ name: 'shop_order_id' })
  shopOrder: Relation<ShopOrder>;

  /** Rider picked the parcel up from the shop. */
  @Timestamp()
  collectedAt: Date | null;
}
