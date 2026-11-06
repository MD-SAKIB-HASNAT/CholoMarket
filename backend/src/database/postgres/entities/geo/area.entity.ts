import { AREA_KINDS, inList } from 'src/database/enums';
import { District } from 'src/database/postgres/entities/geo/district.entity';
import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from 'typeorm';

@Entity('areas')
@Unique(['districtId', 'nameEn'])
@Check('CHK_areas_kind', inList('kind', AREA_KINDS))
export class Area {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id: number;

  @Column({ type: 'smallint' })
  districtId: number;

  @ManyToOne(() => District)
  @JoinColumn({ name: 'district_id' })
  district: Relation<District>;

  @Column({ type: 'text' })
  nameEn: string;

  @Column({ type: 'text' })
  nameBn: string;

  @Column({ type: 'varchar', length: 20, default: 'thana' })
  kind: string;

  /** [PHASE 2] delivery coverage. */
  @Column({ type: 'boolean', default: false })
  isServiceable: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
