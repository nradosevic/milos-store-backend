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
exports.AdminCategoriesController = void 0;
const common_1 = require("@nestjs/common");
const categories_service_1 = require("./categories.service");
const create_category_dto_1 = require("./dto/create-category.dto");
const update_category_dto_1 = require("./dto/update-category.dto");
const bulk_import_category_dto_1 = require("./dto/bulk-import-category.dto");
let AdminCategoriesController = class AdminCategoriesController {
    constructor(categoriesService) {
        this.categoriesService = categoriesService;
    }
    findAll() {
        return this.categoriesService.findAll();
    }
    create(dto) {
        return this.categoriesService.create(dto);
    }
    update(id, dto) {
        return this.categoriesService.update(id, dto);
    }
    remove(id) {
        return this.categoriesService.remove(id);
    }
    bulkImport(dto, mode = 'merge') {
        return this.categoriesService.bulkImport(dto.categories, mode);
    }
    bulkExport() {
        return this.categoriesService.exportTree();
    }
};
exports.AdminCategoriesController = AdminCategoriesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminCategoriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_category_dto_1.CreateCategoryDto]),
    __metadata("design:returntype", void 0)
], AdminCategoriesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_category_dto_1.UpdateCategoryDto]),
    __metadata("design:returntype", void 0)
], AdminCategoriesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AdminCategoriesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('bulk-import'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('mode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bulk_import_category_dto_1.BulkImportCategoriesDto, String]),
    __metadata("design:returntype", void 0)
], AdminCategoriesController.prototype, "bulkImport", null);
__decorate([
    (0, common_1.Get)('bulk-export'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminCategoriesController.prototype, "bulkExport", null);
exports.AdminCategoriesController = AdminCategoriesController = __decorate([
    (0, common_1.Controller)('admin/categories'),
    __metadata("design:paramtypes", [categories_service_1.CategoriesService])
], AdminCategoriesController);
//# sourceMappingURL=admin-categories.controller.js.map