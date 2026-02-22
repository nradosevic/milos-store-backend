import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
export declare class TagsService {
    private tagRepository;
    constructor(tagRepository: Repository<Tag>);
    findAll(): Promise<Tag[]>;
    findBySlug(slug: string): Promise<Tag>;
    findBySlugWithProducts(slug: string, page?: number, limit?: number): Promise<{
        tag: Tag;
        products: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    findById(id: number): Promise<Tag>;
    findOrCreate(name: string): Promise<Tag>;
    create(dto: CreateTagDto): Promise<Tag>;
    update(id: number, dto: UpdateTagDto): Promise<Tag>;
    remove(id: number): Promise<void>;
    merge(sourceId: number, targetId: number): Promise<Tag>;
}
