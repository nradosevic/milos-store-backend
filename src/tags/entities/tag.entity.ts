import {
  Entity, PrimaryGeneratedColumn, Column, ManyToMany,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity()
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @ManyToMany(() => Product, (p) => p.tags)
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
