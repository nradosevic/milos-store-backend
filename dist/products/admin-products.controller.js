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
exports.AdminProductsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const products_service_1 = require("./products.service");
const upload_service_1 = require("../upload/upload.service");
const create_product_dto_1 = require("./dto/create-product.dto");
const update_product_dto_1 = require("./dto/update-product.dto");
const query_products_dto_1 = require("./dto/query-products.dto");
let AdminProductsController = class AdminProductsController {
    constructor(productsService, uploadService) {
        this.productsService = productsService;
        this.uploadService = uploadService;
    }
    findAll(query) {
        return this.productsService.findAll(query);
    }
    create(dto) {
        return this.productsService.create(dto);
    }
    update(id, dto) {
        return this.productsService.update(id, dto);
    }
    remove(id) {
        return this.productsService.remove(id);
    }
    markSold(id) {
        return this.productsService.markSold(id);
    }
    async uploadImages(id, files) {
        const images = [];
        for (const file of files) {
            const { s3Key, thumbnailS3Key } = await this.uploadService.uploadProductImage(id, file);
            const image = await this.productsService.addImage(id, {
                s3Key,
                thumbnailS3Key,
                originalName: file.originalname,
                isMain: false,
                sortOrder: 0,
            });
            images.push(image);
        }
        return images;
    }
    updateImage(id, imageId, data) {
        return this.productsService.updateImage(id, imageId, data);
    }
    async deleteImage(id, imageId) {
        const image = await this.productsService.findImage(id, imageId);
        if (image.s3Key)
            await this.uploadService.deleteFile(image.s3Key);
        if (image.thumbnailS3Key)
            await this.uploadService.deleteFile(image.thumbnailS3Key);
        return this.productsService.removeImage(id, imageId);
    }
};
exports.AdminProductsController = AdminProductsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_products_dto_1.QueryProductsDto]),
    __metadata("design:returntype", void 0)
], AdminProductsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_product_dto_1.CreateProductDto]),
    __metadata("design:returntype", void 0)
], AdminProductsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_product_dto_1.UpdateProductDto]),
    __metadata("design:returntype", void 0)
], AdminProductsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AdminProductsController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/mark-sold'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AdminProductsController.prototype, "markSold", null);
__decorate([
    (0, common_1.Post)(':id/images'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 20, { storage: (0, multer_1.memoryStorage)() })),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Array]),
    __metadata("design:returntype", Promise)
], AdminProductsController.prototype, "uploadImages", null);
__decorate([
    (0, common_1.Patch)(':id/images/:imageId'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('imageId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", void 0)
], AdminProductsController.prototype, "updateImage", null);
__decorate([
    (0, common_1.Delete)(':id/images/:imageId'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('imageId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminProductsController.prototype, "deleteImage", null);
exports.AdminProductsController = AdminProductsController = __decorate([
    (0, common_1.Controller)('admin/products'),
    __metadata("design:paramtypes", [products_service_1.ProductsService,
        upload_service_1.UploadService])
], AdminProductsController);
//# sourceMappingURL=admin-products.controller.js.map