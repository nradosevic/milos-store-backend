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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductImage = void 0;
const typeorm_1 = require("typeorm");
const product_entity_1 = require("./product.entity");
let ProductImage = class ProductImage {
};
exports.ProductImage = ProductImage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ProductImage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProductImage.prototype, "s3Key", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ProductImage.prototype, "thumbnailS3Key", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProductImage.prototype, "originalName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ProductImage.prototype, "altText", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ProductImage.prototype, "isMain", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], ProductImage.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, (p) => p.images, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'productId' }),
    __metadata("design:type", product_entity_1.Product)
], ProductImage.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ProductImage.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ProductImage.prototype, "createdAt", void 0);
exports.ProductImage = ProductImage = __decorate([
    (0, typeorm_1.Entity)()
], ProductImage);
//# sourceMappingURL=product-image.entity.js.map