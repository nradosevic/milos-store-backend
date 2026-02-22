import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, ManyToMany,
  JoinTable, CreateDateColumn, UpdateDateColumn, JoinColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { ProductImage } from './product-image.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  shortDescription: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ default: false })
  priceOnRequest: boolean;

  @Column({ type: 'int', nullable: true })
  year: number;

  @Column({ nullable: true })
  condition: string;

  @Column({ nullable: true })
  origin: string;

  @Column({ nullable: true })
  dimensions: string;

  @Column({ nullable: true })
  material: string;

  @Column({ nullable: true })
  author: string;

  @Column({ nullable: true })
  publisher: string;

  @Column({ nullable: true })
  period: string;

  @Column({ type: 'jsonb', default: '[]' })
  hiddenFields: string[];

  @Column({ type: 'jsonb', default: '{}' })
  customFields: Record<string, string>;

  @Column({ default: true })
  isUnique: boolean;

  @Column({ default: 1 })
  stock: number;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isSold: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @ManyToOne(() => Category, (cat) => cat.products, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ nullable: true })
  categoryId: number;

  @OneToMany(() => ProductImage, (img) => img.product, { cascade: true })
  images: ProductImage[];

  @ManyToMany(() => Tag, (tag) => tag.products, { cascade: true })
  @JoinTable({ name: 'product_tags' })
  tags: Tag[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
