import { Area } from 'src/database/postgres/entities/geo/area.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from 'typeorm';

/**
 * Fourth level: a neighbourhood, section, block or road inside an area
 * (division → district → area → sub-area, e.g. Rajshahi → Rajshahi → Boalia → Shaheb Bazar).
 */
@Entity('sub_areas')
@Unique(['areaId', 'nameEn'])
export class SubArea {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id: number;

  @Column({ type: 'int' })
  areaId: number;

  @ManyToOne(() => Area)
  @JoinColumn({ name: 'area_id' })
  area: Relation<Area>;

  @Column({ type: 'text' })
  nameEn: string;

  @Column({ type: 'text' })
  nameBn: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
