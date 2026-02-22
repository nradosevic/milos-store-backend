import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { TagsController } from './tags.controller';
import { AdminTagsController } from './admin-tags.controller';
import { TagsService } from './tags.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Tag } from './entities/tag.entity';
import { ConfigService } from '@nestjs/config';

const TEST_JWT_SECRET = 'test-jwt-secret';

const makeTag = (overrides: Partial<Tag> = {}): Tag => ({
  id: 1,
  name: 'SFRJ',
  slug: 'sfrj',
  products: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
} as Tag);

const mockTagRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
  manager: {
    query: jest.fn().mockResolvedValue([]),
  },
};

describe('Tags Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let adminToken: string;

  beforeAll(async () => {
    const qb: any = {
      loadRelationCountAndMap: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    mockTagRepo.createQueryBuilder.mockReturnValue(qb);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: TEST_JWT_SECRET, signOptions: { expiresIn: '7d' } }),
      ],
      controllers: [TagsController, AdminTagsController],
      providers: [
        TagsService,
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
    const qb: any = {
      loadRelationCountAndMap: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    mockTagRepo.createQueryBuilder.mockReturnValue(qb);
    mockTagRepo.manager.query.mockResolvedValue([]);
  });

  it('[tag-list] should return array of tags each with product count', async () => {
    const tags = [
      { ...makeTag({ id: 1, name: 'SFRJ', slug: 'sfrj' }), productCount: 5 },
      { ...makeTag({ id: 2, name: 'Retko izdanje', slug: 'retko-izdanje' }), productCount: 2 },
    ];
    const qb: any = {
      loadRelationCountAndMap: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(tags),
    };
    mockTagRepo.createQueryBuilder.mockReturnValue(qb);

    const response = await request(app.getHttpServer())
      .get('/tags')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('slug');
    expect(response.body[0]).toHaveProperty('productCount');
  });

  it('[tag-products] should return tag info and paginated products with that tag', async () => {
    const tag = makeTag({ slug: 'sfrj' });
    mockTagRepo.findOne.mockResolvedValue(tag);
    mockTagRepo.manager.query
      .mockResolvedValueOnce([{ total: '3' }])
      .mockResolvedValueOnce([
        { id: 1, title: 'Produkt 1', slug: 'produkt-1' },
        { id: 2, title: 'Produkt 2', slug: 'produkt-2' },
      ]);

    const response = await request(app.getHttpServer())
      .get('/tags/sfrj')
      .expect(200);

    expect(response.body).toHaveProperty('tag');
    expect(response.body.tag.slug).toBe('sfrj');
    expect(response.body).toHaveProperty('products');
    expect(Array.isArray(response.body.products)).toBe(true);
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
  });

  it('[tag-crud-admin] should create a new tag', async () => {
    mockTagRepo.findOne.mockResolvedValue(null);
    const newTag = makeTag({ id: 5, name: 'Novi tag', slug: 'novi-tag' });
    mockTagRepo.create.mockReturnValue(newTag);
    mockTagRepo.save.mockResolvedValue(newTag);

    const response = await request(app.getHttpServer())
      .post('/admin/tags')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Novi tag' })
      .expect(201);

    expect(response.body.name).toBe('Novi tag');
    expect(response.body.slug).toBe('novi-tag');
  });

  it('[tag-crud-admin] should rename tag and update slug and name', async () => {
    const tag = makeTag({ id: 1, name: 'Old Name', slug: 'old-name' });
    mockTagRepo.findOne.mockResolvedValue(tag);
    const updated = { ...tag, name: 'New Name', slug: 'new-name' };
    mockTagRepo.save.mockResolvedValue(updated);

    const response = await request(app.getHttpServer())
      .patch('/admin/tags/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'New Name' })
      .expect(200);

    expect(response.body.name).toBe('New Name');
    expect(response.body.slug).toBe('new-name');
  });

  it('[tag-crud-admin] should delete tag and remove from system', async () => {
    const tag = makeTag({ id: 1 });
    mockTagRepo.findOne.mockResolvedValue(tag);
    mockTagRepo.remove.mockResolvedValue(tag);

    const response = await request(app.getHttpServer())
      .delete('/admin/tags/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect([200, 204]).toContain(response.status);
    expect(mockTagRepo.remove).toHaveBeenCalledWith(tag);
  });
});
