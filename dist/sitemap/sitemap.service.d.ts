import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
export declare class SitemapService {
    private productRepository;
    private categoryRepository;
    constructor(productRepository: Repository<Product>, categoryRepository: Repository<Category>);
    generateSitemap(baseUrl?: string): Promise<string>;
}
