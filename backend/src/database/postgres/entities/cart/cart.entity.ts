import { CreatedAt, IdColumn, UpdatedAt } from 'src/database/postgres/columns';
import { CartItem } from 'src/database/postgres/entities/cart/cart-item.entity';
import { User } from 'src/database/postgres/entities/user/user.entity';
import {
  Check,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  type Relation,
} from 'typeorm';

/** One cart per customer, spanning many shops. */
@Entity('carts')
@Check('CHK_carts_owner', '"user_id" IS NOT NULL OR "guest_token" IS NOT NULL')
export class Cart {
  @IdColumn()
  id: number;

  @Column({ type: 'int', nullable: true, unique: true })
  userId: number | null;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User> | null;

  /** Lets guests browse and add before logging in. */
  @Column({ type: 'uuid', nullable: true, unique: true })
  guestToken: string | null;

  @OneToMany(() => CartItem, (i) => i.cart)
  items: Relation<CartItem[]>;

  @CreatedAt()
  createdAt: Date;

  @UpdatedAt()
  updatedAt: Date;
}
