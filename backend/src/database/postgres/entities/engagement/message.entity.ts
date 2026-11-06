import { MESSAGE_SIDES, inList, type MessageSide } from 'src/database/enums';
import {
  BigIdColumn,
  CreatedAt,
  Timestamp,
} from 'src/database/postgres/columns';
import { Conversation } from 'src/database/postgres/entities/engagement/conversation.entity';
import { PriceOffer } from 'src/database/postgres/entities/engagement/price-offer.entity';
import { Product } from 'src/database/postgres/entities/product/product.entity';
import { User } from 'src/database/postgres/entities/user/user.entity';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

@Entity('messages')
@Check('CHK_messages_side', inList('sender_side', MESSAGE_SIDES))
@Index(['conversationId', 'createdAt'])
export class Message {
  @BigIdColumn()
  id: string;

  @Column({ type: 'int' })
  conversationId: number;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Relation<Conversation>;

  @Column({ type: 'int' })
  senderId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: Relation<User>;

  @Column({ type: 'varchar', length: 10 })
  senderSide: MessageSide;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @Column({ type: 'text', nullable: true })
  attachmentUrl: string | null;

  /** "Asking about this product". */
  @Column({ type: 'int', nullable: true })
  productId: number | null;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Relation<Product> | null;

  @Column({ type: 'int', nullable: true })
  offerId: number | null;

  @ManyToOne(() => PriceOffer)
  @JoinColumn({ name: 'offer_id' })
  offer: Relation<PriceOffer> | null;

  @CreatedAt()
  createdAt: Date;

  @Timestamp()
  readAt: Date | null;
}
