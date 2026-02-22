import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { MergeTagsDto } from './dto/merge-tags.dto';
export declare class AdminTagsController {
    private readonly tagsService;
    constructor(tagsService: TagsService);
    findAll(): Promise<import("./entities/tag.entity").Tag[]>;
    create(dto: CreateTagDto): Promise<import("./entities/tag.entity").Tag>;
    update(id: number, dto: UpdateTagDto): Promise<import("./entities/tag.entity").Tag>;
    remove(id: number): Promise<void>;
    merge(dto: MergeTagsDto): Promise<import("./entities/tag.entity").Tag>;
}
