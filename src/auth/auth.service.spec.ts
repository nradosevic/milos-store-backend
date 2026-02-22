import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Admin } from './entities/admin.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

const mockAdminRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(),
});

describe('AuthService', () => {
  let service: AuthService;
  let adminRepo: ReturnType<typeof mockAdminRepository>;
  let jwtService: ReturnType<typeof mockJwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(Admin), useFactory: mockAdminRepository },
        { provide: JwtService, useFactory: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    adminRepo = module.get(getRepositoryToken(Admin));
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return access_token on valid credentials', async () => {
      const admin: Admin = { id: 1, email: 'admin@test.rs', password: 'hashed', createdAt: new Date(), updatedAt: new Date() };
      adminRepo.findOne.mockResolvedValue(admin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login({ email: 'admin@test.rs', password: 'password' });
      expect(result).toEqual({ access_token: 'jwt-token' });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: 1, email: 'admin@test.rs' });
    });

    it('should throw UnauthorizedException when admin not found', async () => {
      adminRepo.findOne.mockResolvedValue(null);
      await expect(service.login({ email: 'wrong@test.rs', password: 'pass' })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      const admin: Admin = { id: 1, email: 'admin@test.rs', password: 'hashed', createdAt: new Date(), updatedAt: new Date() };
      adminRepo.findOne.mockResolvedValue(admin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login({ email: 'admin@test.rs', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('createAdmin', () => {
    it('should hash password and save admin', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      const created = { id: 1, email: 'new@test.rs', password: 'hashed-password', createdAt: new Date(), updatedAt: new Date() };
      adminRepo.create.mockReturnValue(created);
      adminRepo.save.mockResolvedValue(created);

      const result = await service.createAdmin('new@test.rs', 'plaintext');
      expect(bcrypt.hash).toHaveBeenCalledWith('plaintext', 10);
      expect(adminRepo.create).toHaveBeenCalledWith({ email: 'new@test.rs', password: 'hashed-password' });
      expect(result).toEqual(created);
    });
  });

  describe('findAdminByEmail', () => {
    it('should return admin when found', async () => {
      const admin: Admin = { id: 1, email: 'admin@test.rs', password: 'hashed', createdAt: new Date(), updatedAt: new Date() };
      adminRepo.findOne.mockResolvedValue(admin);
      const result = await service.findAdminByEmail('admin@test.rs');
      expect(result).toEqual(admin);
      expect(adminRepo.findOne).toHaveBeenCalledWith({ where: { email: 'admin@test.rs' } });
    });

    it('should return null when not found', async () => {
      adminRepo.findOne.mockResolvedValue(null);
      const result = await service.findAdminByEmail('nonexistent@test.rs');
      expect(result).toBeNull();
    });
  });
});
