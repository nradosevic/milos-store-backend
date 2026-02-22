import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Admin } from './entities/admin.entity';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private adminRepository;
    private jwtService;
    constructor(adminRepository: Repository<Admin>, jwtService: JwtService);
    login(loginDto: LoginDto): Promise<{
        access_token: string;
    }>;
    createAdmin(email: string, password: string): Promise<Admin>;
    findAdminByEmail(email: string): Promise<Admin | null>;
}
