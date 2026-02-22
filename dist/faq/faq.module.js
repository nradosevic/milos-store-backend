"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaqModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const faq_item_entity_1 = require("./entities/faq-item.entity");
const faq_service_1 = require("./faq.service");
const faq_controller_1 = require("./faq.controller");
const admin_faq_controller_1 = require("./admin-faq.controller");
let FaqModule = class FaqModule {
};
exports.FaqModule = FaqModule;
exports.FaqModule = FaqModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([faq_item_entity_1.FaqItem])],
        controllers: [faq_controller_1.FaqController, admin_faq_controller_1.AdminFaqController],
        providers: [faq_service_1.FaqService],
        exports: [faq_service_1.FaqService],
    })
], FaqModule);
//# sourceMappingURL=faq.module.js.map