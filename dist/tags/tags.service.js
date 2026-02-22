"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const tag_entity_1 = require("./entities/tag.entity");
const slugify_1 = require("../common/utils/slugify");
let TagsService = class TagsService {
    constructor(tagRepository) {
        this.tagRepository = tagRepository;
    }
    async findAll() {
        return this.tagRepository
            .createQueryBuilder('tag')
            .loadRelationCountAndMap('tag.productCount', 'tag.products')
            .orderBy('tag.name', 'ASC')
            .getMany();
    }
    async findBySlug(slug) {
        const tag = await this.tagRepository.findOne({ where: { slug } });
        if (!tag)
            throw new common_1.NotFoundException(`Tag with slug "${slug}" not found`);
        return tag;
    }
    async findBySlugWithProducts(slug, page = 1, limit = 20) {
        const tag = await this.findBySlug(slug);
        const skip = (page - 1) * limit;
        let products = [];
        let total = 0;
        try {
            const countRow = await this.tagRepository.manager.query(`SELECT COUNT(*) as total FROM product p
         INNER JOIN product_tags pt ON pt."productId" = p.id
         WHERE pt."tagId" = $1 AND p."isActive" = true`, [tag.id]);
            total = Number(countRow[0]?.total || 0);
            products = await this.tagRepository.manager.query(`SELECT p.* FROM product p
         INNER JOIN product_tags pt ON pt."productId" = p.id
         WHERE pt."tagId" = $1 AND p."isActive" = true
         ORDER BY p."sortOrder" ASC, p."createdAt" DESC
         LIMIT $2 OFFSET $3`, [tag.id, limit, skip]);
        }
        catch {
        }
        return { tag, products, total, page, limit };
    }
    async findById(id) {
        const tag = await this.tagRepository.findOne({ where: { id } });
        if (!tag)
            throw new common_1.NotFoundException(`Tag #${id} not found`);
        return tag;
    }
    async findOrCreate(name) {
        const slug = (0, slugify_1.slugify)(name);
        let tag = await this.tagRepository.findOne({ where: { slug } });
        if (!tag) {
            tag = this.tagRepository.create({ name, slug });
            tag = await this.tagRepository.save(tag);
        }
        return tag;
    }
    async create(dto) {
        const slug = dto.slug || (0, slugify_1.slugify)(dto.name);
        const existing = await this.tagRepository.findOne({ where: { slug } });
        if (existing)
            throw new common_1.BadRequestException(`Tag with slug "${slug}" already exists`);
        const tag = this.tagRepository.create({ name: dto.name, slug });
        return this.tagRepository.save(tag);
    }
    async update(id, dto) {
        const tag = await this.findById(id);
        if (dto.name) {
            tag.name = dto.name;
            tag.slug = dto.slug || (0, slugify_1.slugify)(dto.name);
        }
        if (dto.slug)
            tag.slug = dto.slug;
        return this.tagRepository.save(tag);
    }
    async remove(id) {
        const tag = await this.findById(id);
        await this.tagRepository.remove(tag);
    }
    async merge(sourceId, targetId) {
        const source = await this.tagRepository.findOne({
            where: { id: sourceId },
            relations: ['products'],
        });
        const target = await this.tagRepository.findOne({
            where: { id: targetId },
            relations: ['products'],
        });
        if (!source || !target)
            throw new common_1.NotFoundException('Tag not found');
        const existingProductIds = new Set(target.products.map((p) => p.id));
        for (const product of source.products) {
            if (!existingProductIds.has(product.id)) {
                target.products.push(product);
            }
        }
        await this.tagRepository.save(target);
        await this.tagRepository.remove(source);
        return target;
    }
};
exports.TagsService = TagsService;
exports.TagsService = TagsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tag_entity_1.Tag)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TagsService);
//# sourceMappingURL=tags.service.js.map