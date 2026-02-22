import { Product } from '../../products/entities/product.entity';
export declare class Tag {
    id: number;
    name: string;
    slug: string;
    products: Product[];
    createdAt: Date;
    updatedAt: Date;
}
