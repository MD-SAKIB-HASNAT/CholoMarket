import { CreatedAt, IdColumn } from 'src/database/postgres/columns';
import { SupportTicket } from 'src/database/postgres/entities/aftersale/support-ticket.entity';
import { User } from 'src/database/postgres/entities/user/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

@Entity('support_ticket_notes')
export class SupportTicketNote {
  @IdColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  ticketId: number;

  @ManyToOne(() => SupportTicket, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Relation<SupportTicket>;

  @Column({ type: 'int' })
  authorId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: Relation<User>;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'boolean', default: false })
  isInternal: boolean;

  @CreatedAt()
  createdAt: Date;
}
