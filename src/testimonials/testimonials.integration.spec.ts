import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { TestimonialsController } from './testimonials.controller';
import { AdminTestimonialsController } from './admin-testimonials.controller';
import { TestimonialsService } from './testimonials.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Testimonial } from './entities/testimonial.entity';
import { ConfigService } from '@nestjs/config';

const TEST_JWT_SECRET = 'test-jwt-secret';

describe('Testimonials Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let adminToken: string;

  const mockTestimonialRepo = {
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
      controllers: [TestimonialsController, AdminTestimonialsController],
      providers: [
        TestimonialsService,
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
        { provide: getRepositoryToken(Testimonial), useValue: mockTestimonialRepo },
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

  it('[testimonial-crud] should create new testimonial', async () => {
    const testimonial = {
      id: 1,
      text: 'Odlična usluga, pronašao sam što sam tražio!',
      authorName: 'Marko P.',
      source: 'Google',
      isActive: true,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockTestimonialRepo.create.mockReturnValue(testimonial);
    mockTestimonialRepo.save.mockResolvedValue(testimonial);

    const response = await request(app.getHttpServer())
      .post('/admin/testimonials')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ text: 'Odlična usluga, pronašao sam što sam tražio!', authorName: 'Marko P.', source: 'Google' })
      .expect(201);

    expect(response.body.text).toBe('Odlična usluga, pronašao sam što sam tražio!');
    expect(response.body.authorName).toBe('Marko P.');
  });

  it('[testimonial-crud] should update testimonial text and sortOrder', async () => {
    const testimonial = { id: 1, text: 'Old text', sortOrder: 0, isActive: true, createdAt: new Date(), updatedAt: new Date() };
    mockTestimonialRepo.findOne.mockResolvedValue(testimonial);
    const updated = { ...testimonial, text: 'Updated text', sortOrder: 2 };
    mockTestimonialRepo.save.mockResolvedValue(updated);

    const response = await request(app.getHttpServer())
      .patch('/admin/testimonials/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ text: 'Updated text', sortOrder: 2 })
      .expect(200);

    expect(response.body.text).toBe('Updated text');
    expect(response.body.sortOrder).toBe(2);
  });

  it('[testimonial-crud] should delete testimonial', async () => {
    const testimonial = { id: 1, text: 'Test', isActive: true, createdAt: new Date(), updatedAt: new Date() };
    mockTestimonialRepo.findOne.mockResolvedValue(testimonial);
    mockTestimonialRepo.remove.mockResolvedValue(testimonial);

    const response = await request(app.getHttpServer())
      .delete('/admin/testimonials/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect([200, 204]).toContain(response.status);
    expect(mockTestimonialRepo.remove).toHaveBeenCalledWith(testimonial);
  });

  it('[testimonial-crud] should return only active testimonials ordered by sortOrder on GET /testimonials', async () => {
    const active = [
      { id: 1, text: 'First', isActive: true, sortOrder: 0, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, text: 'Second', isActive: true, sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
    ];
    mockTestimonialRepo.find.mockResolvedValue(active);

    const response = await request(app.getHttpServer())
      .get('/testimonials')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(mockTestimonialRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });
});
