import { ProductsService } from './products.service';
import { UploadService } from '../upload/upload.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
export declare class AdminProductsController {
    private readonly productsService;
    private readonly uploadService;
    constructor(productsService: ProductsService, uploadService: UploadService);
    findAll(query: QueryProductsDto): Promise<{
        data: import("./entities/product.entity").Product[];
        total: number;
        page: number;
        limit: number;
    }>;
    create(dto: CreateProductDto): Promise<import("./entities/product.entity").Product>;
    update(id: number, dto: UpdateProductDto): Promise<import("./entities/product.entity").Product>;
    remove(id: number): Promise<void>;
    markSold(id: number): Promise<import("./entities/product.entity").Product>;
    uploadImages(id: number, files: Express.Multer.File[]): Promise<any[]>;
    updateImage(id: number, imageId: number, data: {
        isMain?: boolean;
        sortOrder?: number;
        altText?: string;
    }): Promise<import("./entities/product-image.entity").ProductImage>;
    deleteImage(id: number, imageId: number): Promise<import("./entities/product-image.entity").ProductImage>;
}
