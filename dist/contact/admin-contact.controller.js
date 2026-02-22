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
exports.AdminContactController = void 0;
const common_1 = require("@nestjs/common");
const contact_service_1 = require("./contact.service");
let AdminContactController = class AdminContactController {
    constructor(contactService) {
        this.contactService = contactService;
    }
    async findAll(page = 1, limit = 20, isRead) {
        const isReadBool = isRead === 'true' ? true : isRead === 'false' ? false : undefined;
        const [data, total] = await this.contactService.findAll(page, limit, isReadBool);
        return { data, total, page, limit };
    }
    update(id, body) {
        return this.contactService.update(id, body);
    }
};
exports.AdminContactController = AdminContactController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('isRead')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], AdminContactController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], AdminContactController.prototype, "update", null);
exports.AdminContactController = AdminContactController = __decorate([
    (0, common_1.Controller)('admin/contacts'),
    __metadata("design:paramtypes", [contact_service_1.ContactService])
], AdminContactController);
//# sourceMappingURL=admin-contact.controller.js.map