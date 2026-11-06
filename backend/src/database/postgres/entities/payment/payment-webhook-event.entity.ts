import { CreatedAt, IdColumn, Timestamp } from 'src/database/postgres/columns';
import { Column, Entity, Unique } from 'typeorm';

/** Raw, idempotent store of gateway callbacks. */
@Entity('payment_webhook_events')
@Unique(['gateway', 'eventId'])
export class PaymentWebhookEvent {
  @IdColumn()
  id: number;

  @Column({ type: 'varchar', length: 20 })
  gateway: string;

  @Column({ type: 'text' })
  eventId: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @CreatedAt()
  receivedAt: Date;

  @Timestamp()
  processedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;
}
