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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const admin_entity_1 = require("./entities/admin.entity");
let AuthService = class AuthService {
    constructor(adminRepository, jwtService) {
        this.adminRepository = adminRepository;
        this.jwtService = jwtService;
    }
    async login(loginDto) {
        const admin = await this.adminRepository.findOne({ where: { email: loginDto.email } });
        if (!admin)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const isMatch = await bcrypt.compare(loginDto.password, admin.password);
        if (!isMatch)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const payload = { sub: admin.id, email: admin.email };
        return { access_token: this.jwtService.sign(payload) };
    }
    async createAdmin(email, password) {
        const hashed = await bcrypt.hash(password, 10);
        const admin = this.adminRepository.create({ email, password: hashed });
        return this.adminRepository.save(admin);
    }
    async findAdminByEmail(email) {
        return this.adminRepository.findOne({ where: { email } });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(admin_entity_1.Admin)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map