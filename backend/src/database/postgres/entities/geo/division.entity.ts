import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('divisions')
export class Division {
  @PrimaryGeneratedColumn('identity', {
    type: 'smallint',
    generatedIdentity: 'ALWAYS',
  })
  id: number;

  @Column({ type: 'text', unique: true })
  nameEn: string;

  @Column({ type: 'text' })
  nameBn: string;

  /** Hidden from the pickers (not deleted) when false. */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
