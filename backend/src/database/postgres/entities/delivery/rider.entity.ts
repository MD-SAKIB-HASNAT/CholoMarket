import { RIDER_STATUSES, VEHICLE_TYPES, inList } from 'src/database/enums';
import {
  CoordinateColumn,
  CreatedAt,
  MoneyColumn,
  StatusColumn,
  Timestamp,
} from 'src/database/postgres/columns';
import { PickupPoint } from 'src/database/postgres/entities/market/pickup-point.entity';
import { User } from 'src/database/postgres/entities/user/user.entity';
import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';

@Entity('riders')
@Check('CHK_riders_vehicle', inList('vehicle_type', VEHICLE_TYPES))
@Check('CHK_riders_status', inList('status', RIDER_STATUSES))
export class Rider {
  @PrimaryColumn({ type: 'int' })
  userId: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ type: 'int', nullable: true })
  homeHubId: number | null;

  @ManyToOne(() => PickupPoint)
  @JoinColumn({ name: 'home_hub_id' })
  homeHub: Relation<PickupPoint> | null;

  @Column({ type: 'varchar', length: 10 })
  vehicleType: string;

  @Column({ type: 'boolean', default: false })
  nidVerified: boolean;

  @StatusColumn('offline', 15)
  status: string;

  @CoordinateColumn()
  lastLatitude: number | null;

  @CoordinateColumn()
  lastLongitude: number | null;

  @Timestamp()
  lastSeenAt: Date | null;

  /** COD collected but not yet deposited. */
  @MoneyColumn({ default: 0 })
  cashInHand: number;

  @CreatedAt()
  createdAt: Date;
}
