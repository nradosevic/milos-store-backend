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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const category_entity_1 = require("./entities/category.entity");
const slugify_1 = require("../common/utils/slugify");
let CategoriesService = class CategoriesService {
    constructor(categoryRepository) {
        this.categoryRepository = categoryRepository;
    }
    async findTree() {
        const all = await this.categoryRepository.find({
            where: { isActive: true },
            order: { sortOrder: 'ASC', name: 'ASC' },
        });
        let countMap = new Map();
        try {
            const countRows = await this.categoryRepository.manager.query(`SELECT "categoryId", COUNT(*) as count FROM product WHERE "isActive" = true AND "categoryId" IS NOT NULL GROUP BY "categoryId"`);
            countMap = new Map(countRows.map((r) => [Number(r.categoryId), Number(r.count)]));
        }
        catch {
        }
        return this.buildTree(all.map((c) => ({ ...c, productCount: countMap.get(c.id) || 0 })), null);
    }
    buildTree(categories, parentId) {
        return categories
            .filter((c) => c.parentId === parentId)
            .map((c) => ({
            ...c,
            children: this.buildTree(categories, c.id),
        }));
    }
    async findAll() {
        return this.categoryRepository.find({
            order: { sortOrder: 'ASC', name: 'ASC' },
        });
    }
    async findBySlug(slug) {
        const category = await this.categoryRepository.findOne({
            where: { slug, isActive: true },
        });
        if (!category)
            throw new common_1.NotFoundException(`Category with slug "${slug}" not found`);
        return category;
    }
    async findBySlugWithProducts(slug, page = 1, limit = 20) {
        const category = await this.findBySlug(slug);
        const descendantIds = await this.getDescendantIds(category.id);
        const skip = (page - 1) * limit;
        let products = [];
        let total = 0;
        try {
            const countRow = await this.categoryRepository.manager.query(`SELECT COUNT(*) as total FROM product WHERE "categoryId" = ANY($1) AND "isActive" = true`, [descendantIds]);
            total = Number(countRow[0]?.total || 0);
            products = await this.categoryRepository.manager.query(`SELECT p.* FROM product p WHERE p."categoryId" = ANY($1) AND p."isActive" = true ORDER BY p."sortOrder" ASC, p."createdAt" DESC LIMIT $2 OFFSET $3`, [descendantIds, limit, skip]);
        }
        catch {
        }
        return { category, products, total, page, limit };
    }
    async findById(id) {
        const category = await this.categoryRepository.findOne({ where: { id } });
        if (!category)
            throw new common_1.NotFoundException(`Category #${id} not found`);
        return category;
    }
    async getDescendantIds(categoryId) {
        const all = await this.categoryRepository.find();
        const ids = [categoryId];
        const queue = [categoryId];
        while (queue.length > 0) {
            const current = queue.shift();
            const children = all.filter((c) => c.parentId === current);
            for (const child of children) {
                ids.push(child.id);
                queue.push(child.id);
            }
        }
        return ids;
    }
    async create(dto) {
        const slug = dto.slug || (0, slugify_1.slugify)(dto.name);
        const existing = await this.categoryRepository.findOne({ where: { slug } });
        if (existing)
            throw new common_1.BadRequestException(`Slug "${slug}" already exists`);
        let depth = 0;
        if (dto.parentId) {
            const parent = await this.findById(dto.parentId);
            depth = parent.depth + 1;
        }
        const category = this.categoryRepository.create({ ...dto, slug, depth });
        return this.categoryRepository.save(category);
    }
    async update(id, dto) {
        const category = await this.findById(id);
        if (dto.slug && dto.slug !== category.slug) {
            const existing = await this.categoryRepository.findOne({ where: { slug: dto.slug } });
            if (existing)
                throw new common_1.BadRequestException(`Slug "${dto.slug}" already exists`);
        }
        if (dto.name && !dto.slug) {
            dto.slug = (0, slugify_1.slugify)(dto.name);
        }
        if (dto.parentId !== undefined) {
            if (dto.parentId === id)
                throw new common_1.BadRequestException('Category cannot be its own parent');
            let depth = 0;
            if (dto.parentId) {
                const parent = await this.findById(dto.parentId);
                depth = parent.depth + 1;
            }
            Object.assign(category, { ...dto, depth });
        }
        else {
            Object.assign(category, dto);
        }
        return this.categoryRepository.save(category);
    }
    async remove(id) {
        const category = await this.findById(id);
        const childCount = await this.categoryRepository.count({ where: { parentId: id } });
        if (childCount > 0)
            throw new common_1.BadRequestException('Cannot delete category with subcategories');
        await this.categoryRepository.remove(category);
    }
    async bulkImport(categories, mode) {
        if (mode === 'replace') {
            await this.categoryRepository.delete({ parentId: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()) });
            await this.categoryRepository.delete({ parentId: (0, typeorm_2.IsNull)() });
        }
        await this.importTree(categories, null, 0);
    }
    async importTree(items, parentId, depth) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const slug = item.slug || (0, slugify_1.slugify)(item.name);
            let category = await this.categoryRepository.findOne({ where: { slug } });
            if (!category) {
                category = this.categoryRepository.create({
                    name: item.name,
                    slug,
                    description: item.description,
                    iconName: item.iconName,
                    parentId: parentId ?? undefined,
                    depth,
                    sortOrder: i,
                });
                category = await this.categoryRepository.save(category);
            }
            else {
                category.name = item.name;
                if (item.description !== undefined)
                    category.description = item.description;
                if (item.iconName !== undefined)
                    category.iconName = item.iconName;
                category.depth = depth;
                category.sortOrder = i;
                if (parentId !== null)
                    category.parentId = parentId;
                category = await this.categoryRepository.save(category);
            }
            if (item.children && item.children.length > 0) {
                await this.importTree(item.children, category.id, depth + 1);
            }
        }
    }
    async exportTree() {
        const all = await this.categoryRepository.find({ order: { sortOrder: 'ASC' } });
        return this.buildExportTree(all, null);
    }
    buildExportTree(categories, parentId) {
        return categories
            .filter((c) => c.parentId === parentId)
            .map((c) => ({
            name: c.name,
            slug: c.slug,
            description: c.description,
            iconName: c.iconName,
            children: this.buildExportTree(categories, c.id),
        }));
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map