import { Division } from 'src/database/postgres/entities/geo/division.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from 'typeorm';

@Entity('districts')
@Unique(['divisionId', 'nameEn'])
export class District {
  @PrimaryGeneratedColumn('identity', {
    type: 'smallint',
    generatedIdentity: 'ALWAYS',
  })
  id: number;

  @Column({ type: 'smallint' })
  divisionId: number;

  @ManyToOne(() => Division)
  @JoinColumn({ name: 'division_id' })
  division: Relation<Division>;

  @Column({ type: 'text' })
  nameEn: string;

  @Column({ type: 'text' })
  nameBn: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
