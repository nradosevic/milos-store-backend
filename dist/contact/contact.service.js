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
exports.ContactService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const contact_submission_entity_1 = require("./entities/contact-submission.entity");
let ContactService = class ContactService {
    constructor(contactRepository) {
        this.contactRepository = contactRepository;
    }
    create(dto) {
        const submission = this.contactRepository.create(dto);
        return this.contactRepository.save(submission);
    }
    findAll(page = 1, limit = 20, isRead) {
        const where = {};
        if (isRead !== undefined)
            where.isRead = isRead;
        return this.contactRepository.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
    }
    async findById(id) {
        const c = await this.contactRepository.findOne({ where: { id } });
        if (!c)
            throw new common_1.NotFoundException(`Contact submission #${id} not found`);
        return c;
    }
    async update(id, data) {
        const c = await this.findById(id);
        Object.assign(c, data);
        return this.contactRepository.save(c);
    }
};
exports.ContactService = ContactService;
exports.ContactService = ContactService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(contact_submission_entity_1.ContactSubmission)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ContactService);
//# sourceMappingURL=contact.service.js.map