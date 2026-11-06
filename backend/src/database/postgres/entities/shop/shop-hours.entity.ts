import { Shop } from 'src/database/postgres/entities/shop/shop.entity';
import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';

@Entity('shop_hours')
@Check('CHK_shop_hours_weekday', '"weekday" BETWEEN 0 AND 6')
export class ShopHours {
  @PrimaryColumn({ type: 'int' })
  shopId: number;

  @PrimaryColumn({ type: 'smallint' })
  weekday: number;

  @ManyToOne(() => Shop, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop: Relation<Shop>;

  @Column({ type: 'time', nullable: true })
  opensAt: string | null;

  @Column({ type: 'time', nullable: true })
  closesAt: string | null;

  @Column({ type: 'boolean', default: false })
  isClosed: boolean;
}
