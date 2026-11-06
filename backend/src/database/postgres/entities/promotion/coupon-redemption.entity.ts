import {
  CreatedAt,
  IdColumn,
  MoneyColumn,
} from 'src/database/postgres/columns';
import { Order } from 'src/database/postgres/entities/order/order.entity';
import { Coupon } from 'src/database/postgres/entities/promotion/coupon.entity';
import { User } from 'src/database/postgres/entities/user/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

@Entity('coupon_redemptions')
@Index(['couponId', 'userId'])
export class CouponRedemption {
  @IdColumn()
  id: number;

  @Column({ type: 'int' })
  couponId: number;

  @ManyToOne(() => Coupon)
  @JoinColumn({ name: 'coupon_id' })
  coupon: Relation<Coupon>;

  @Column({ type: 'int', unique: true })
  orderId: number;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Relation<Order>;

  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @MoneyColumn()
  discountAmount: number;

  @CreatedAt()
  createdAt: Date;
}
