import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
  CreateDateColumn, UpdateDateColumn, JoinColumn,
} from 'typeorm';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  iconName: string;

  @Column({ default: 0 })
  depth: number;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Category, (cat) => cat.children, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentId' })
  parent: Category;

  @Column({ nullable: true })
  parentId: number | null;

  @OneToMany(() => Category, (cat) => cat.parent)
  children: Category[];

  @OneToMany('Product', 'category')
  products: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
