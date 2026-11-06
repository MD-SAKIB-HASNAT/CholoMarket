import { DELIVERY_ZONES, inList, type DeliveryZone } from 'src/database/enums';
import {
  CoordinateColumn,
  CreatedAt,
  IdColumn,
  UpdatedAt,
} from 'src/database/postgres/columns';
import { Area } from 'src/database/postgres/entities/geo/area.entity';
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

/** Saved delivery addresses. */
@Entity('user_addresses')
@Check('CHK_user_addresses_zone', inList('zone', DELIVERY_ZONES))
@Index('UQ_user_addresses_one_default', ['userId'], {
  unique: true,
  where: '"is_default"',
})
export class UserAddress {
  @IdColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ type: 'text', nullable: true })
  label: string | null;

  @Column({ type: 'text' })
  recipientName: string;

  @Column({ type: 'varchar', length: 14 })
  phone: string;

  /** Optional link to a known thana/area; districts outside our list use the text fields. */
  @Column({ type: 'int', nullable: true })
  areaId: number | null;

  @ManyToOne(() => Area)
  @JoinColumn({ name: 'area_id' })
  area: Relation<Area> | null;

  @Column({ type: 'text' })
  district: string;

  /** Thana / area, e.g. "Mirpur 10". */
  @Column({ type: 'text' })
  areaName: string;

  @Column({ type: 'text' })
  addressLine: string;

  /** Decides the delivery charge. */
  @Column({ type: 'varchar', length: 20, default: 'inside_dhaka' })
  zone: DeliveryZone;

  @Column({ type: 'text', nullable: true })
  landmark: string | null;

  @CoordinateColumn()
  latitude: number | null;

  @CoordinateColumn()
  longitude: number | null;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @CreatedAt()
  createdAt: Date;

  @UpdatedAt()
  updatedAt: Date;
}
