import { ProductsService } from './products.service';
import { QueryProductsDto } from './dto/query-products.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(query: QueryProductsDto): Promise<{
        data: import("./entities/product.entity").Product[];
        total: number;
        page: number;
        limit: number;
    }>;
    findFeatured(): Promise<import("./entities/product.entity").Product[]>;
    findBySlug(slug: string): Promise<import("./entities/product.entity").Product & {
        breadcrumb: any[];
        related: import("./entities/product.entity").Product[];
    }>;
}
