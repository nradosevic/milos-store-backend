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
exports.AdminTagsController = void 0;
const common_1 = require("@nestjs/common");
const tags_service_1 = require("./tags.service");
const create_tag_dto_1 = require("./dto/create-tag.dto");
const update_tag_dto_1 = require("./dto/update-tag.dto");
const merge_tags_dto_1 = require("./dto/merge-tags.dto");
let AdminTagsController = class AdminTagsController {
    constructor(tagsService) {
        this.tagsService = tagsService;
    }
    findAll() {
        return this.tagsService.findAll();
    }
    create(dto) {
        return this.tagsService.create(dto);
    }
    update(id, dto) {
        return this.tagsService.update(id, dto);
    }
    remove(id) {
        return this.tagsService.remove(id);
    }
    merge(dto) {
        return this.tagsService.merge(dto.sourceId, dto.targetId);
    }
};
exports.AdminTagsController = AdminTagsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminTagsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_tag_dto_1.CreateTagDto]),
    __metadata("design:returntype", void 0)
], AdminTagsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_tag_dto_1.UpdateTagDto]),
    __metadata("design:returntype", void 0)
], AdminTagsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AdminTagsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('merge'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [merge_tags_dto_1.MergeTagsDto]),
    __metadata("design:returntype", void 0)
], AdminTagsController.prototype, "merge", null);
exports.AdminTagsController = AdminTagsController = __decorate([
    (0, common_1.Controller)('admin/tags'),
    __metadata("design:paramtypes", [tags_service_1.TagsService])
], AdminTagsController);
//# sourceMappingURL=admin-tags.controller.js.map