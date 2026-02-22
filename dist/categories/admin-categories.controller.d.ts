import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { BulkImportCategoriesDto } from './dto/bulk-import-category.dto';
export declare class AdminCategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(): Promise<import("./entities/category.entity").Category[]>;
    create(dto: CreateCategoryDto): Promise<import("./entities/category.entity").Category>;
    update(id: number, dto: UpdateCategoryDto): Promise<import("./entities/category.entity").Category>;
    remove(id: number): Promise<void>;
    bulkImport(dto: BulkImportCategoriesDto, mode?: string): Promise<void>;
    bulkExport(): Promise<any[]>;
}
