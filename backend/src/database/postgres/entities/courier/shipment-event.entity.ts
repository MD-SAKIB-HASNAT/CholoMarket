import { type ShipmentStatus } from 'src/database/enums';
import { BigIdColumn, CreatedAt } from 'src/database/postgres/columns';
import { Shipment } from 'src/database/postgres/entities/courier/shipment.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';

@Entity('shipment_events')
@Index(['shipmentId', 'createdAt'])
export class ShipmentEvent {
  @BigIdColumn()
  id: string;

  @Column({ type: 'int' })
  shipmentId: number;

  @ManyToOne(() => Shipment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shipment_id' })
  shipment: Relation<Shipment>;

  @Column({ type: 'varchar', length: 20 })
  status: ShipmentStatus;

  @Column({ type: 'text', nullable: true })
  courierStatus: string | null;

  /** booking | poll | webhook | manual */
  @Column({ type: 'varchar', length: 10 })
  source: string;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ type: 'jsonb', nullable: true })
  raw: Record<string, any> | null;

  @CreatedAt()
  createdAt: Date;
}
