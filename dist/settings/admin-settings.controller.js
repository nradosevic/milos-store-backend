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
exports.AdminSettingsController = void 0;
const common_1 = require("@nestjs/common");
const settings_service_1 = require("./settings.service");
let AdminSettingsController = class AdminSettingsController {
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    findAll() {
        return this.settingsService.findAll();
    }
    upsert(body) {
        return this.settingsService.upsert(body.key, body.value, body.type);
    }
    async update(id, body) {
        const all = await this.settingsService.findAll();
        const setting = all.find((s) => s.id === id);
        if (!setting)
            throw new common_1.NotFoundException(`Setting #${id} not found`);
        return this.settingsService.upsert(setting.key, body.value, body.type || setting.type);
    }
    remove(id) {
        return this.settingsService.remove(id);
    }
};
exports.AdminSettingsController = AdminSettingsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminSettingsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminSettingsController.prototype, "upsert", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminSettingsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AdminSettingsController.prototype, "remove", null);
exports.AdminSettingsController = AdminSettingsController = __decorate([
    (0, common_1.Controller)('admin/settings'),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], AdminSettingsController);
//# sourceMappingURL=admin-settings.controller.js.map