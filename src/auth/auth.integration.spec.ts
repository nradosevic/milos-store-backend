import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Admin } from './entities/admin.entity';
import { ConfigService } from '@nestjs/config';
import { Controller, Get } from '@nestjs/common';

const TEST_JWT_SECRET = 'test-jwt-secret';

@Controller('admin/dashboard')
class TestAdminController {
  @Get()
  dashboard() {
    return { stats: 'ok' };
  }
}

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const adminEntity: Admin = {
    id: 1,
    email: 'admin@rariteti.rs',
    password: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdminRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeAll(async () => {
    adminEntity.password = await bcrypt.hash('admin123', 10);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: TEST_JWT_SECRET, signOptions: { expiresIn: '7d' } }),
      ],
      controllers: [AuthController, TestAdminController],
      providers: [
        AuthService,
        JwtStrategy,
        JwtAuthGuard,
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, def?: any) => {
              const cfg: Record<string, string> = { JWT_SECRET: TEST_JWT_SECRET };
              return cfg[key] ?? def;
            },
          },
        },
        { provide: getRepositoryToken(Admin), useValue: mockAdminRepo },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    jwtService = module.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('[auth-login-success] should return 200 with access_token in body and token is a valid JWT string', async () => {
    mockAdminRepo.findOne.mockResolvedValue(adminEntity);

    const response = await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ email: 'admin@rariteti.rs', password: 'admin123' })
      .expect(201);

    expect(response.body).toHaveProperty('access_token');
    expect(typeof response.body.access_token).toBe('string');
    // Verify it's a valid JWT (has 3 parts separated by dots)
    const parts = response.body.access_token.split('.');
    expect(parts).toHaveLength(3);
  });

  it('[auth-login-fail] should return 401 when login with wrong password', async () => {
    mockAdminRepo.findOne.mockResolvedValue(adminEntity);

    await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ email: 'admin@rariteti.rs', password: 'wrongpassword' })
      .expect(401);
  });

  it('[auth-login-fail] should return 401 when admin not found', async () => {
    mockAdminRepo.findOne.mockResolvedValue(null);

    await request(app.getHttpServer())
      .post('/admin/auth/login')
      .send({ email: 'wrong@test.rs', password: 'admin123' })
      .expect(401);
  });

  it('[auth-guard-reject] should return 401 without token', async () => {
    await request(app.getHttpServer())
      .get('/admin/dashboard')
      .expect(401);
  });

  it('[auth-guard-reject] should return 401 with invalid token', async () => {
    await request(app.getHttpServer())
      .get('/admin/dashboard')
      .set('Authorization', 'Bearer invalid.token.here')
      .expect(401);
  });

  it('[auth-guard-reject] should allow access with valid JWT token', async () => {
    const token = jwtService.sign({ sub: 1, email: 'admin@rariteti.rs' });

    await request(app.getHttpServer())
      .get('/admin/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
