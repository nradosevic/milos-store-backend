import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { FaqController } from './faq.controller';
import { AdminFaqController } from './admin-faq.controller';
import { FaqService } from './faq.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FaqItem } from './entities/faq-item.entity';
import { ConfigService } from '@nestjs/config';

const TEST_JWT_SECRET = 'test-jwt-secret';

describe('FAQ Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let adminToken: string;

  const mockFaqRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: TEST_JWT_SECRET, signOptions: { expiresIn: '7d' } }),
      ],
      controllers: [FaqController, AdminFaqController],
      providers: [
        FaqService,
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
        { provide: getRepositoryToken(FaqItem), useValue: mockFaqRepo },
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
  });

  it('[faq-crud] should create new FAQ item', async () => {
    const item = {
      id: 1,
      question: 'Kako kupiti?',
      answer: 'Kontaktirajte nas putem obrasca.',
      sortOrder: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockFaqRepo.create.mockReturnValue(item);
    mockFaqRepo.save.mockResolvedValue(item);

    const response = await request(app.getHttpServer())
      .post('/admin/faq')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ question: 'Kako kupiti?', answer: 'Kontaktirajte nas putem obrasca.' })
      .expect(201);

    expect(response.body.question).toBe('Kako kupiti?');
    expect(response.body.answer).toBe('Kontaktirajte nas putem obrasca.');
  });

  it('[faq-crud] should update question and answer', async () => {
    const item = { id: 1, question: 'Old Q', answer: 'Old A', sortOrder: 0, isActive: true, createdAt: new Date(), updatedAt: new Date() };
    mockFaqRepo.findOne.mockResolvedValue(item);
    const updated = { ...item, question: 'Updated Q?', answer: 'Updated answer.' };
    mockFaqRepo.save.mockResolvedValue(updated);

    const response = await request(app.getHttpServer())
      .patch('/admin/faq/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ question: 'Updated Q?', answer: 'Updated answer.' })
      .expect(200);

    expect(response.body.question).toBe('Updated Q?');
    expect(response.body.answer).toBe('Updated answer.');
  });

  it('[faq-crud] should delete FAQ item', async () => {
    const item = { id: 1, question: 'Q', answer: 'A', sortOrder: 0, isActive: true, createdAt: new Date(), updatedAt: new Date() };
    mockFaqRepo.findOne.mockResolvedValue(item);
    mockFaqRepo.remove.mockResolvedValue(item);

    const response = await request(app.getHttpServer())
      .delete('/admin/faq/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect([200, 204]).toContain(response.status);
    expect(mockFaqRepo.remove).toHaveBeenCalledWith(item);
  });

  it('[faq-crud] should return only active FAQ items ordered by sortOrder on GET /faq', async () => {
    const items = [
      { id: 1, question: 'Q1', answer: 'A1', sortOrder: 0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, question: 'Q2', answer: 'A2', sortOrder: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ];
    mockFaqRepo.find.mockResolvedValue(items);

    const response = await request(app.getHttpServer())
      .get('/faq')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(mockFaqRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });
});
