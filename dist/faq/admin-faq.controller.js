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
exports.AdminFaqController = void 0;
const common_1 = require("@nestjs/common");
const faq_service_1 = require("./faq.service");
const create_faq_item_dto_1 = require("./dto/create-faq-item.dto");
const update_faq_item_dto_1 = require("./dto/update-faq-item.dto");
let AdminFaqController = class AdminFaqController {
    constructor(faqService) {
        this.faqService = faqService;
    }
    findAll() {
        return this.faqService.findAllAdmin();
    }
    create(dto) {
        return this.faqService.create(dto);
    }
    update(id, dto) {
        return this.faqService.update(id, dto);
    }
    remove(id) {
        return this.faqService.remove(id);
    }
};
exports.AdminFaqController = AdminFaqController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminFaqController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_faq_item_dto_1.CreateFaqItemDto]),
    __metadata("design:returntype", void 0)
], AdminFaqController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_faq_item_dto_1.UpdateFaqItemDto]),
    __metadata("design:returntype", void 0)
], AdminFaqController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AdminFaqController.prototype, "remove", null);
exports.AdminFaqController = AdminFaqController = __decorate([
    (0, common_1.Controller)('admin/faq'),
    __metadata("design:paramtypes", [faq_service_1.FaqService])
], AdminFaqController);
//# sourceMappingURL=admin-faq.controller.js.map