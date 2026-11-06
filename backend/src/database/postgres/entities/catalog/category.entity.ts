import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id: number;

  @Index()
  @Column({ type: 'int', nullable: true })
  parentId: number | null;

  @ManyToOne(() => Category, (c) => c.children)
  @JoinColumn({ name: 'parent_id' })
  parent: Relation<Category> | null;

  @OneToMany(() => Category, (c) => c.parent)
  children: Relation<Category[]>;

  @Column({ type: 'text', unique: true })
  slug: string;

  @Column({ type: 'text' })
  nameEn: string;

  @Column({ type: 'text' })
  nameBn: string;

  /** Lucide icon name, e.g. "shirt", "smartphone". */
  @Column({ type: 'text', nullable: true })
  icon: string | null;

  /** Photo for category tiles. */
  @Column({ type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
