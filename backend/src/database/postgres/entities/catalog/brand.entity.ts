import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('brands')
export class Brand {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id: number;

  @Column({ type: 'text', unique: true })
  slug: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  logoUrl: string | null;
}
