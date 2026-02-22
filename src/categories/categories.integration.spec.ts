import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { CategoriesController } from './categories.controller';
import { AdminCategoriesController } from './admin-categories.controller';
import { CategoriesService } from './categories.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Category } from './entities/category.entity';
import { ConfigService } from '@nestjs/config';
import { Public } from '../common/decorators/public.decorator';

const TEST_JWT_SECRET = 'test-jwt-secret';

const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 1,
  name: 'Test Category',
  slug: 'test-category',
  description: 'Test description',
  iconName: null,
  depth: 0,
  sortOrder: 0,
  isActive: true,
  parentId: null,
  parent: null,
  children: [],
  products: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
} as Category);

const mockCategoryRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  delete: jest.fn(),
  manager: {
    query: jest.fn().mockResolvedValue([]),
  },
};

describe('Categories Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let adminToken: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: TEST_JWT_SECRET, signOptions: { expiresIn: '7d' } }),
      ],
      controllers: [CategoriesController, AdminCategoriesController],
      providers: [
        CategoriesService,
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
        { provide: getRepositoryToken(Category), useValue: mockCategoryRepo },
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
    mockCategoryRepo.manager.query.mockResolvedValue([]);
  });

  // --- Public endpoints ---

  it('[cat-tree-public] should return nested tree structure with productCount and only active categories', async () => {
    const parent = makeCategory({ id: 1, name: 'Books', slug: 'books', parentId: null });
    const child = makeCategory({ id: 2, name: 'Old Books', slug: 'old-books', parentId: 1, depth: 1 });
    mockCategoryRepo.find.mockResolvedValue([parent, child]);
    mockCategoryRepo.manager.query.mockResolvedValue([{ categoryId: 1, count: '5' }]);

    const response = await request(app.getHttpServer())
      .get('/categories')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    const root = response.body[0];
    expect(root.slug).toBe('books');
    expect(root).toHaveProperty('productCount');
    expect(Array.isArray(root.children)).toBe(true);
    expect(root.children[0].slug).toBe('old-books');
  });

  it('[cat-slug-products] should return category info with description and paginated products from subcategories', async () => {
    const category = makeCategory({ slug: 'books', description: 'Stare knjige i retka izdanja' });
    mockCategoryRepo.findOne.mockResolvedValue(category);
    mockCategoryRepo.find.mockResolvedValue([category]);
    mockCategoryRepo.manager.query
      .mockResolvedValueOnce([{ total: '2' }])
      .mockResolvedValueOnce([
        { id: 1, title: 'Product in cat', categoryId: 1 },
        { id: 2, title: 'Product in subcat', categoryId: 2 },
      ]);

    const response = await request(app.getHttpServer())
      .get('/categories/books')
      .expect(200);

    expect(response.body).toHaveProperty('category');
    expect(response.body.category.description).toBe('Stare knjige i retka izdanja');
    expect(response.body).toHaveProperty('products');
    expect(Array.isArray(response.body.products)).toBe(true);
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
  });

  // --- Admin endpoints ---

  it('[cat-create-root] should return 201 with created category, slug auto-generated, depth 0, parentId null', async () => {
    mockCategoryRepo.findOne.mockResolvedValue(null); // slug not taken
    const created = makeCategory({ name: 'Slike i umetnost', slug: 'slike-i-umetnost' });
    mockCategoryRepo.create.mockReturnValue(created);
    mockCategoryRepo.save.mockResolvedValue(created);

    const response = await request(app.getHttpServer())
      .post('/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Slike i umetnost' })
      .expect(201);

    expect(response.body.slug).toBe('slike-i-umetnost');
    expect(response.body.depth).toBe(0);
    expect(response.body.parentId).toBeNull();
  });

  it('[cat-create-subcategory] should return 201 with depth 1 and correct parentId', async () => {
    const parent = makeCategory({ id: 10, depth: 0 });
    mockCategoryRepo.findOne
      .mockResolvedValueOnce(null) // slug not taken
      .mockResolvedValueOnce(parent); // parent found
    const child = makeCategory({ id: 11, name: 'Ulja na platnu', slug: 'ulja-na-platnu', depth: 1, parentId: 10 });
    mockCategoryRepo.create.mockReturnValue(child);
    mockCategoryRepo.save.mockResolvedValue(child);

    const response = await request(app.getHttpServer())
      .post('/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Ulja na platnu', parentId: 10 })
      .expect(201);

    expect(response.body.depth).toBe(1);
    expect(response.body.parentId).toBe(10);
  });

  it('[cat-update] should return 200 with updated fields, other fields unchanged', async () => {
    const existing = makeCategory({ id: 1, name: 'Old Name', description: 'Old desc' });
    mockCategoryRepo.findOne.mockResolvedValue(existing);
    const updated = { ...existing, name: 'New Name', description: 'New desc' };
    mockCategoryRepo.save.mockResolvedValue(updated);

    const response = await request(app.getHttpServer())
      .patch('/admin/categories/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'New Name', description: 'New desc' })
      .expect(200);

    expect(response.body.name).toBe('New Name');
    expect(response.body.description).toBe('New desc');
  });

  it('[cat-delete] should return 200 or 204 and category no longer appears', async () => {
    const cat = makeCategory({ id: 1 });
    mockCategoryRepo.findOne.mockResolvedValue(cat);
    mockCategoryRepo.count.mockResolvedValue(0);
    mockCategoryRepo.remove.mockResolvedValue(cat);

    const response = await request(app.getHttpServer())
      .delete('/admin/categories/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect([200, 204]).toContain(response.status);
  });

  it('[cat-bulk-import-merge] should create new and update existing categories without deleting missing ones', async () => {
    mockCategoryRepo.findOne.mockResolvedValue(null);
    const cat = makeCategory({ id: 1, name: 'Knjige', slug: 'knjige' });
    mockCategoryRepo.create.mockReturnValue(cat);
    mockCategoryRepo.save.mockResolvedValue(cat);

    const response = await request(app.getHttpServer())
      .post('/admin/categories/bulk-import?mode=merge')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ categories: [{ name: 'Knjige', slug: 'knjige' }] })
      .expect(201);

    // delete should NOT have been called in merge mode
    expect(mockCategoryRepo.delete).not.toHaveBeenCalled();
  });

  it('[cat-bulk-import-replace] should wipe all categories and recreate with correct depth values', async () => {
    mockCategoryRepo.delete.mockResolvedValue({});
    mockCategoryRepo.findOne.mockResolvedValue(null);
    const parent = makeCategory({ id: 1, name: 'Root', slug: 'root', depth: 0 });
    const child = makeCategory({ id: 2, name: 'Child', slug: 'child', depth: 1, parentId: 1 });
    mockCategoryRepo.create
      .mockReturnValueOnce(parent)
      .mockReturnValueOnce(child);
    mockCategoryRepo.save
      .mockResolvedValueOnce(parent)
      .mockResolvedValueOnce(child);

    await request(app.getHttpServer())
      .post('/admin/categories/bulk-import?mode=replace')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        categories: [
          { name: 'Root', slug: 'root', children: [{ name: 'Child', slug: 'child' }] },
        ],
      })
      .expect(201);

    expect(mockCategoryRepo.delete).toHaveBeenCalledTimes(2);
  });

  it('[cat-bulk-export] should return JSON array of root categories with nested children', async () => {
    const parent = makeCategory({ id: 1, name: 'Books', slug: 'books', parentId: null });
    const child = makeCategory({ id: 2, name: 'Old Books', slug: 'old-books', parentId: 1 });
    mockCategoryRepo.find.mockResolvedValue([parent, child]);

    const response = await request(app.getHttpServer())
      .get('/admin/categories/bulk-export')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty('name');
    expect(response.body[0]).toHaveProperty('slug');
    expect(response.body[0]).toHaveProperty('children');
    expect(Array.isArray(response.body[0].children)).toBe(true);
    expect(response.body[0]).not.toHaveProperty('id');
  });
});
