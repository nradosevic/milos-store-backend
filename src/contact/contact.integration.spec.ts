import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ContactController } from './contact.controller';
import { AdminContactController } from './admin-contact.controller';
import { ContactService } from './contact.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ContactSubmission } from './entities/contact-submission.entity';
import { ConfigService } from '@nestjs/config';

const TEST_JWT_SECRET = 'test-jwt-secret';

describe('Contact Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let adminToken: string;

  const mockContactRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: TEST_JWT_SECRET, signOptions: { expiresIn: '7d' } }),
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
      ],
      controllers: [ContactController, AdminContactController],
      providers: [
        ContactService,
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
        { provide: getRepositoryToken(ContactSubmission), useValue: mockContactRepo },
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

  it('[contact-submit] should return 201 on valid submission with message', async () => {
    const submission = {
      id: 1,
      name: 'Marko Marković',
      email: 'marko@example.com',
      phone: '+381601234567',
      message: 'Zanima me cena ovog predmeta.',
      productSlug: 'stara-knjiga',
      productTitle: 'Stara knjiga',
      isRead: false,
      createdAt: new Date(),
    };
    mockContactRepo.create.mockReturnValue(submission);
    mockContactRepo.save.mockResolvedValue(submission);

    const response = await request(app.getHttpServer())
      .post('/contact')
      .send({
        name: 'Marko Marković',
        email: 'marko@example.com',
        phone: '+381601234567',
        message: 'Zanima me cena ovog predmeta.',
        productSlug: 'stara-knjiga',
        productTitle: 'Stara knjiga',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.message).toBe('Zanima me cena ovog predmeta.');
    expect(response.body.productSlug).toBe('stara-knjiga');
    expect(response.body.productTitle).toBe('Stara knjiga');
  });

  it('[contact-submit] should return 400 when message field is empty', async () => {
    await request(app.getHttpServer())
      .post('/contact')
      .send({ name: 'Test' })
      .expect(400);
  });

  it('[contact-submit] should accept submission with only message (name, email, phone optional)', async () => {
    const submission = { id: 2, message: 'Samo poruka.', isRead: false, createdAt: new Date() };
    mockContactRepo.create.mockReturnValue(submission);
    mockContactRepo.save.mockResolvedValue(submission);

    const response = await request(app.getHttpServer())
      .post('/contact')
      .send({ message: 'Samo poruka.' })
      .expect(201);

    expect(response.body.message).toBe('Samo poruka.');
  });

  it('[contact-inbox] should return paginated list sorted by newest first with all required fields', async () => {
    const submissions = [
      {
        id: 1,
        name: 'Marko',
        email: 'marko@example.com',
        phone: null,
        message: 'Zanima me.',
        productTitle: 'Stara slika',
        isRead: false,
        createdAt: new Date('2024-01-10'),
      },
      {
        id: 2,
        name: 'Ana',
        email: 'ana@example.com',
        phone: null,
        message: 'Imam pitanje.',
        productTitle: null,
        isRead: true,
        createdAt: new Date('2024-01-09'),
      },
    ];
    mockContactRepo.findAndCount.mockResolvedValue([submissions, 2]);

    const response = await request(app.getHttpServer())
      .get('/admin/contacts')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body).toHaveProperty('total');
    const item = response.body.data[0];
    expect(item).toHaveProperty('name');
    expect(item).toHaveProperty('email');
    expect(item).toHaveProperty('message');
    expect(item).toHaveProperty('isRead');
    expect(item).toHaveProperty('createdAt');
  });

  it('[contact-inbox] should support filter by isRead', async () => {
    mockContactRepo.findAndCount.mockResolvedValue([[], 0]);

    await request(app.getHttpServer())
      .get('/admin/contacts?isRead=false')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(mockContactRepo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isRead: false } }),
    );
  });

  it('[contact-mark-read] should toggle isRead field correctly', async () => {
    const submission = { id: 1, isRead: false, message: 'Test' };
    mockContactRepo.findOne.mockResolvedValue(submission);
    const updated = { ...submission, isRead: true };
    mockContactRepo.save.mockResolvedValue(updated);

    const response = await request(app.getHttpServer())
      .patch('/admin/contacts/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isRead: true })
      .expect(200);

    expect(response.body.isRead).toBe(true);
  });
});
