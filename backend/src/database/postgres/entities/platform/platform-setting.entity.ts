import { UpdatedAt } from 'src/database/postgres/columns';
import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Tunables: pickup fee, reservation hours, deposit rules, ... */
@Entity('platform_settings')
export class PlatformSetting {
  @PrimaryColumn({ type: 'text' })
  key: string;

  @Column({ type: 'jsonb' })
  value: unknown;

  @Column({ type: 'int', nullable: true })
  updatedBy: number | null;

  @UpdatedAt()
  updatedAt: Date;
}
