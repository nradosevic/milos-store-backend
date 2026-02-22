import { Product } from './product.entity';
export declare class ProductImage {
    id: number;
    s3Key: string;
    thumbnailS3Key: string;
    originalName: string;
    altText: string;
    isMain: boolean;
    sortOrder: number;
    product: Product;
    productId: number;
    createdAt: Date;
}
