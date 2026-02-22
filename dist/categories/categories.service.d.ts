import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { BulkImportCategoryItemDto } from './dto/bulk-import-category.dto';
export declare class CategoriesService {
    private categoryRepository;
    constructor(categoryRepository: Repository<Category>);
    findTree(): Promise<any[]>;
    private buildTree;
    findAll(): Promise<Category[]>;
    findBySlug(slug: string): Promise<Category>;
    findBySlugWithProducts(slug: string, page?: number, limit?: number): Promise<{
        category: Category;
        products: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    findById(id: number): Promise<Category>;
    getDescendantIds(categoryId: number): Promise<number[]>;
    create(dto: CreateCategoryDto): Promise<Category>;
    update(id: number, dto: UpdateCategoryDto): Promise<Category>;
    remove(id: number): Promise<void>;
    bulkImport(categories: BulkImportCategoryItemDto[], mode: string): Promise<void>;
    private importTree;
    exportTree(): Promise<any[]>;
    private buildExportTree;
}
