import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Admin } from './entities/admin.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const admin = await this.adminRepository.findOne({ where: { email: loginDto.email } });
    if (!admin) throw new UnauthorizedException('Invalid credentials');
    const isMatch = await bcrypt.compare(loginDto.password, admin.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');
    const payload = { sub: admin.id, email: admin.email };
    return { access_token: this.jwtService.sign(payload) };
  }

  async createAdmin(email: string, password: string): Promise<Admin> {
    const hashed = await bcrypt.hash(password, 10);
    const admin = this.adminRepository.create({ email, password: hashed });
    return this.adminRepository.save(admin);
  }

  async findAdminByEmail(email: string): Promise<Admin | null> {
    return this.adminRepository.findOne({ where: { email } });
  }
}
