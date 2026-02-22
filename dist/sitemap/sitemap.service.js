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
exports.SitemapService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../products/entities/product.entity");
const category_entity_1 = require("../categories/entities/category.entity");
let SitemapService = class SitemapService {
    constructor(productRepository, categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }
    async generateSitemap(baseUrl = 'https://rariteti.rs') {
        const products = await this.productRepository.find({
            where: { isActive: true },
            select: ['slug', 'updatedAt'],
        });
        const categories = await this.categoryRepository.find({
            where: { isActive: true },
            select: ['slug', 'updatedAt'],
        });
        const urls = [
            `<url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
            `<url><loc>${baseUrl}/products</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
            `<url><loc>${baseUrl}/faq</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`,
            `<url><loc>${baseUrl}/contact</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`,
        ];
        for (const product of products) {
            urls.push(`<url><loc>${baseUrl}/products/${product.slug}</loc><lastmod>${product.updatedAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
        }
        for (const category of categories) {
            urls.push(`<url><loc>${baseUrl}/categories/${category.slug}</loc><lastmod>${category.updatedAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`);
        }
        return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
    }
};
exports.SitemapService = SitemapService;
exports.SitemapService = SitemapService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], SitemapService);
//# sourceMappingURL=sitemap.service.js.map