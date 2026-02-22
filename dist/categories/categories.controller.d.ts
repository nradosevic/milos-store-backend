import { CategoriesService } from './categories.service';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    findTree(): Promise<any[]>;
    findBySlug(slug: string, page?: number, limit?: number): Promise<{
        category: import("./entities/category.entity").Category;
        products: any[];
        total: number;
        page: number;
        limit: number;
    }>;
}
