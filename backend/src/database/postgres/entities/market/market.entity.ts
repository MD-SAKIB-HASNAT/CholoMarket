import {
  MARKET_KINDS,
  MARKET_STATUSES,
  inList,
  type MarketKind,
  type MarketStatus,
} from 'src/database/enums';
import {
  CoordinateColumn,
  CreatedAt,
  IdColumn,
  StatusColumn,
  UpdatedAt,
} from 'src/database/postgres/columns';
import { Area } from 'src/database/postgres/entities/geo/area.entity';
import { SubArea } from 'src/database/postgres/entities/geo/sub-area.entity';
import { MarketFloor } from 'src/database/postgres/entities/market/market-floor.entity';
import { PickupPoint } from 'src/database/postgres/entities/market/pickup-point.entity';
import { User } from 'src/database/postgres/entities/user/user.entity';
import {
  Check,
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  type Relation,
} from 'typeorm';

@Entity('markets')
@Check('CHK_markets_kind', inList('kind', MARKET_KINDS))
@Check('CHK_markets_status', inList('status', MARKET_STATUSES))
@Check('CHK_markets_off_day', '"weekly_off_day" BETWEEN 0 AND 6')
export class Market {
  @IdColumn()
  id: number;

  @Column({ type: 'text', unique: true })
  slug: string;

  @Column({ type: 'text' })
  nameEn: string;

  @Column({ type: 'text' })
  nameBn: string;

  @StatusColumn(undefined, 20)
  kind: MarketKind;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index()
  @Column({ type: 'int' })
  areaId: number;

  @ManyToOne(() => Area)
  @JoinColumn({ name: 'area_id' })
  area: Relation<Area>;

  /** Neighbourhood inside the area (optional). */
  @Index()
  @Column({ type: 'int', nullable: true })
  subAreaId: number | null;

  @ManyToOne(() => SubArea, { nullable: true })
  @JoinColumn({ name: 'sub_area_id' })
  subArea: Relation<SubArea> | null;

  @Column({ type: 'text' })
  addressLine: string;

  @CoordinateColumn()
  latitude: number | null;

  @CoordinateColumn()
  longitude: number | null;

  @Column({ type: 'text', nullable: true })
  logoUrl: string | null;

  @Column({ type: 'text', nullable: true })
  coverUrl: string | null;

  @Column({ type: 'time', nullable: true })
  opensAt: string | null;

  @Column({ type: 'time', nullable: true })
  closesAt: string | null;

  /** 0 = Sunday ... 6 = Saturday */
  @Column({ type: 'smallint', nullable: true })
  weeklyOffDay: number | null;

  /** Official partnership with the mall's management. */
  @Column({ type: 'boolean', default: false })
  isPartner: boolean;

  @Column({ type: 'date', nullable: true })
  partnerSince: string | null;

  @StatusColumn('draft', 20)
  status: MarketStatus;

  @Column({ type: 'int', nullable: true })
  createdBy: number | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: Relation<User>;

  @OneToMany(() => MarketFloor, (f) => f.market)
  floors: Relation<MarketFloor[]>;

  @OneToMany(() => PickupPoint, (p) => p.market)
  pickupPoints: Relation<PickupPoint[]>;

  @CreatedAt()
  createdAt: Date;

  @UpdatedAt()
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
