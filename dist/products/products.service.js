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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("./entities/product.entity");
const product_image_entity_1 = require("./entities/product-image.entity");
const tags_service_1 = require("../tags/tags.service");
const categories_service_1 = require("../categories/categories.service");
const slugify_1 = require("../common/utils/slugify");
let ProductsService = class ProductsService {
    constructor(productRepository, imageRepository, tagsService, categoriesService) {
        this.productRepository = productRepository;
        this.imageRepository = imageRepository;
        this.tagsService = tagsService;
        this.categoriesService = categoriesService;
    }
    async findAll(query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;
        let qb = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.images', 'images')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.tags', 'tags')
            .where('product.isActive = :isActive', { isActive: true });
        if (query.search) {
            qb = qb.andWhere('(product.title ILIKE :search OR product.description ILIKE :search)', { search: `%${query.search}%` });
        }
        if (query.categorySlug) {
            const category = await this.categoriesService.findBySlug(query.categorySlug);
            const categoryIds = await this.categoriesService.getDescendantIds(category.id);
            qb = qb.andWhere('product.categoryId IN (:...categoryIds)', { categoryIds });
        }
        if (query.tags) {
            const tagSlugs = query.tags.split(',').map((t) => t.trim());
            qb = qb.andWhere('tags.slug IN (:...tagSlugs)', { tagSlugs });
        }
        if (query.yearMin)
            qb = qb.andWhere('product.year >= :yearMin', { yearMin: query.yearMin });
        if (query.yearMax)
            qb = qb.andWhere('product.year <= :yearMax', { yearMax: query.yearMax });
        if (query.condition)
            qb = qb.andWhere('product.condition = :condition', { condition: query.condition });
        if (query.priceMin)
            qb = qb.andWhere('product.price >= :priceMin', { priceMin: query.priceMin });
        if (query.priceMax)
            qb = qb.andWhere('product.price <= :priceMax', { priceMax: query.priceMax });
        if (query.isUnique !== undefined)
            qb = qb.andWhere('product.isUnique = :isUnique', { isUnique: query.isUnique });
        if (query.isSold !== undefined)
            qb = qb.andWhere('product.isSold = :isSold', { isSold: query.isSold });
        const dir = (query.sortDir?.toLowerCase() === 'desc' ? 'DESC' : 'ASC');
        if (query.sortBy === 'price')
            qb = qb.orderBy('product.price', dir);
        else if (query.sortBy === 'year')
            qb = qb.orderBy('product.year', dir);
        else if (query.sortBy === 'createdAt')
            qb = qb.orderBy('product.createdAt', dir);
        else if (query.sortBy === 'title')
            qb = qb.orderBy('product.title', dir);
        else {
            qb = qb.orderBy('product.sortOrder', 'ASC').addOrderBy('product.createdAt', 'DESC');
        }
        const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
        return { data, total, page, limit };
    }
    async findFeatured() {
        return this.productRepository.find({
            where: { isFeatured: true, isActive: true },
            relations: ['images', 'category'],
            order: { sortOrder: 'ASC' },
        });
    }
    async findBySlug(slug) {
        const product = await this.productRepository.findOne({
            where: { slug, isActive: true },
            relations: ['images', 'category', 'tags'],
        });
        if (!product)
            throw new common_1.NotFoundException(`Product with slug "${slug}" not found`);
        const breadcrumb = [];
        if (product.category) {
            let cat = product.category;
            while (cat) {
                breadcrumb.unshift({ id: cat.id, name: cat.name, slug: cat.slug });
                if (cat.parentId) {
                    cat = await this.categoriesService.findById(cat.parentId).catch(() => null);
                }
                else {
                    cat = null;
                }
            }
        }
        const related = await this.productRepository.find({
            where: { categoryId: product.categoryId, isActive: true, isSold: false },
            relations: ['images'],
            take: 4,
            order: { sortOrder: 'ASC' },
        });
        return { ...product, breadcrumb, related: related.filter((r) => r.id !== product.id) };
    }
    async findById(id) {
        const product = await this.productRepository.findOne({
            where: { id },
            relations: ['images', 'category', 'tags'],
        });
        if (!product)
            throw new common_1.NotFoundException(`Product #${id} not found`);
        return product;
    }
    async create(dto) {
        const slug = dto.slug || (0, slugify_1.slugify)(dto.title);
        const existing = await this.productRepository.findOne({ where: { slug } });
        if (existing)
            throw new common_1.BadRequestException(`Slug "${slug}" already exists`);
        const tags = dto.tags ? await Promise.all(dto.tags.map((name) => this.tagsService.findOrCreate(name))) : [];
        const product = this.productRepository.create({
            ...dto,
            slug,
            tags,
        });
        return this.productRepository.save(product);
    }
    async update(id, dto) {
        const product = await this.findById(id);
        if (dto.slug && dto.slug !== product.slug) {
            const existing = await this.productRepository.findOne({ where: { slug: dto.slug } });
            if (existing)
                throw new common_1.BadRequestException(`Slug "${dto.slug}" already exists`);
        }
        if (dto.title && !dto.slug) {
            dto.slug = (0, slugify_1.slugify)(dto.title);
        }
        if (dto.tags !== undefined) {
            product.tags = await Promise.all(dto.tags.map((name) => this.tagsService.findOrCreate(name)));
        }
        const { tags, ...rest } = dto;
        Object.assign(product, rest);
        return this.productRepository.save(product);
    }
    async remove(id) {
        const product = await this.findById(id);
        await this.productRepository.remove(product);
    }
    async markSold(id) {
        const product = await this.findById(id);
        product.isSold = true;
        product.stock = 0;
        return this.productRepository.save(product);
    }
    async addImage(productId, imageData) {
        await this.findById(productId);
        const image = this.imageRepository.create({ ...imageData, productId });
        return this.imageRepository.save(image);
    }
    async updateImage(productId, imageId, data) {
        const image = await this.imageRepository.findOne({ where: { id: imageId, productId } });
        if (!image)
            throw new common_1.NotFoundException(`Image #${imageId} not found`);
        if (data.isMain) {
            await this.imageRepository.update({ productId }, { isMain: false });
        }
        Object.assign(image, data);
        return this.imageRepository.save(image);
    }
    async findImage(productId, imageId) {
        const image = await this.imageRepository.findOne({ where: { id: imageId, productId } });
        if (!image)
            throw new common_1.NotFoundException(`Image #${imageId} not found`);
        return image;
    }
    async removeImage(productId, imageId) {
        const image = await this.findImage(productId, imageId);
        await this.imageRepository.remove(image);
        return image;
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(product_image_entity_1.ProductImage)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        tags_service_1.TagsService,
        categories_service_1.CategoriesService])
], ProductsService);
//# sourceMappingURL=products.service.js.map