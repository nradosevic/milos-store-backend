import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity()
export class ProductImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  s3Key: string;

  @Column({ nullable: true })
  thumbnailS3Key: string;

  @Column()
  originalName: string;

  @Column({ nullable: true })
  altText: string;

  @Column({ default: false })
  isMain: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @ManyToOne(() => Product, (p) => p.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: number;

  @CreateDateColumn()
  createdAt: Date;
}
