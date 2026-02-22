import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { Tag } from '../tags/entities/tag.entity';
import { ContactSubmission } from '../contact/entities/contact-submission.entity';
import { ConfigService } from '@nestjs/config';

const TEST_JWT_SECRET = 'test-jwt-secret';

describe('Dashboard Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let adminToken: string;

  const mockProductRepo = { count: jest.fn() };
  const mockContactRepo = { count: jest.fn(), find: jest.fn() };
  const mockCategoryRepo = { count: jest.fn() };
  const mockTagRepo = { count: jest.fn() };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: TEST_JWT_SECRET, signOptions: { expiresIn: '7d' } }),
      ],
      controllers: [DashboardController],
      providers: [
        DashboardService,
        JwtStrategy,
        JwtAuthGuard,
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, def?: any) => {
              const cfg: Record<string, string> = { JWT_SECRET: TEST_JWT_SECRET };
              return cfg[key] ?? def;
            },
          },
        },
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
        { provide: getRepositoryToken(ContactSubmission), useValue: mockContactRepo },
        { provide: getRepositoryToken(Category), useValue: mockCategoryRepo },
        { provide: getRepositoryToken(Tag), useValue: mockTagRepo },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    jwtService = module.get<JwtService>(JwtService);
    adminToken = jwtService.sign({ sub: 1, email: 'admin@rariteti.rs' });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockProductRepo.count.mockResolvedValue(0);
    mockContactRepo.count.mockResolvedValue(0);
    mockContactRepo.find.mockResolvedValue([]);
    mockCategoryRepo.count.mockResolvedValue(0);
    mockTagRepo.count.mockResolvedValue(0);
  });

  it('[dashboard-stats] should return correct aggregate stats including products, contacts, categories', async () => {
    mockProductRepo.count
      .mockResolvedValueOnce(50)  // total products
      .mockResolvedValueOnce(42)  // active products
      .mockResolvedValueOnce(8)   // sold products
      .mockResolvedValueOnce(5);  // featured products
    mockContactRepo.count
      .mockResolvedValueOnce(20)  // total contacts
      .mockResolvedValueOnce(7);  // unread contacts
    mockCategoryRepo.count.mockResolvedValue(12);
    mockTagRepo.count.mockResolvedValue(25);
    mockContactRepo.find.mockResolvedValue([]);

    const response = await request(app.getHttpServer())
      .get('/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('products');
    expect(response.body.products.total).toBe(50);
    expect(response.body.products.active).toBe(42);
    expect(response.body.products.sold).toBe(8);

    expect(response.body).toHaveProperty('contacts');
    expect(response.body.contacts.unread).toBe(7);

    expect(response.body).toHaveProperty('categories');
    expect(response.body.categories.total).toBe(12);
  });
});
