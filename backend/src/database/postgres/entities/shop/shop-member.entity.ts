import { SHOP_ROLES, inList, type ShopRole } from 'src/database/enums';
import { CreatedAt } from 'src/database/postgres/columns';
import { Shop } from 'src/database/postgres/entities/shop/shop.entity';
import { User } from 'src/database/postgres/entities/user/user.entity';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';

@Entity('shop_members')
@Check('CHK_shop_members_role', inList('role', SHOP_ROLES))
export class ShopMember {
  @PrimaryColumn({ type: 'int' })
  shopId: number;

  @Index()
  @PrimaryColumn({ type: 'int' })
  userId: number;

  @ManyToOne(() => Shop, (s) => s.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop: Relation<Shop>;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ type: 'varchar', length: 20 })
  role: ShopRole;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreatedAt()
  createdAt: Date;
}
