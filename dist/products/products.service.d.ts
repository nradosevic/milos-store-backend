import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { TagsService } from '../tags/tags.service';
import { CategoriesService } from '../categories/categories.service';
export declare class ProductsService {
    private productRepository;
    private imageRepository;
    private tagsService;
    private categoriesService;
    constructor(productRepository: Repository<Product>, imageRepository: Repository<ProductImage>, tagsService: TagsService, categoriesService: CategoriesService);
    findAll(query: QueryProductsDto): Promise<{
        data: Product[];
        total: number;
        page: number;
        limit: number;
    }>;
    findFeatured(): Promise<Product[]>;
    findBySlug(slug: string): Promise<Product & {
        breadcrumb: any[];
        related: Product[];
    }>;
    findById(id: number): Promise<Product>;
    create(dto: CreateProductDto): Promise<Product>;
    update(id: number, dto: UpdateProductDto): Promise<Product>;
    remove(id: number): Promise<void>;
    markSold(id: number): Promise<Product>;
    addImage(productId: number, imageData: Partial<ProductImage>): Promise<ProductImage>;
    updateImage(productId: number, imageId: number, data: Partial<ProductImage>): Promise<ProductImage>;
    findImage(productId: number, imageId: number): Promise<ProductImage>;
    removeImage(productId: number, imageId: number): Promise<ProductImage>;
}
