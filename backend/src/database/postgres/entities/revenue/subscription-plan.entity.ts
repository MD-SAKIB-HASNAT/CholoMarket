import { MoneyColumn, PercentColumn } from 'src/database/postgres/columns';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('identity', {
    type: 'smallint',
    generatedIdentity: 'ALWAYS',
  })
  id: number;

  /** 'free' | 'basic' | 'pro' */
  @Column({ type: 'text', unique: true })
  code: string;

  @Column({ type: 'text' })
  nameEn: string;

  @Column({ type: 'text' })
  nameBn: string;

  @MoneyColumn({ default: 0 })
  monthlyPrice: number;

  /** NULL = unlimited. */
  @Column({ type: 'int', nullable: true })
  maxProducts: number | null;

  @Column({ type: 'int', nullable: true })
  maxStaff: number | null;

  /** Percentage points taken off the commission rate. */
  @PercentColumn({ default: 0 })
  commissionDiscount: number;

  @Column({ type: 'jsonb', default: {} })
  features: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
