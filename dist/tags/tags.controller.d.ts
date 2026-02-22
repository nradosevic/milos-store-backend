import { TagsService } from './tags.service';
export declare class TagsController {
    private readonly tagsService;
    constructor(tagsService: TagsService);
    findAll(): Promise<import("./entities/tag.entity").Tag[]>;
    findBySlug(slug: string, page?: number, limit?: number): Promise<{
        tag: import("./entities/tag.entity").Tag;
        products: any[];
        total: number;
        page: number;
        limit: number;
    }>;
}
