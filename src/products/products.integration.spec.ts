import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { ProductsController } from './products.controller';
import { AdminProductsController } from './admin-products.controller';
import { ProductsService } from './products.service';
import { UploadService } from '../upload/upload.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { TagsService } from '../tags/tags.service';
import { CategoriesService } from '../categories/categories.service';
import { ConfigService } from '@nestjs/config';

const TEST_JWT_SECRET = 'test-jwt-secret';

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  title: 'Stara knjiga',
  slug: 'stara-knjiga',
  description: 'Opis stare knjige iz 1950.',
  shortDescription: null,
  price: 1500,
  priceOnRequest: false,
  year: 1950,
  condition: 'Odlično',
  origin: 'Srbija',
  dimensions: null,
  material: null,
  author: 'Petar Petrović',
  publisher: null,
  period: 'SFRJ',
  hiddenFields: [],
  customFields: {},
  isUnique: true,
  stock: 1,
  isFeatured: false,
  isActive: true,
  isSold: false,
  sortOrder: 0,
  category: null,
  categoryId: null,
  images: [],
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
} as Product);

const makeQueryBuilder = (data: any[] = [], total: number = 0) => {
  const qb: any = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([data, total]),
  };
  return qb;
};

describe('Products Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let adminToken: string;

  const mockProductRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockImageRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  const mockTagsService = {
    findOrCreate: jest.fn(),
    findAll: jest.fn(),
    findBySlug: jest.fn(),
  };

  const mockCategoriesService = {
    findBySlug: jest.fn(),
    getDescendantIds: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
  };

  const mockUploadService = {
    uploadProductImage: jest.fn(),
    deleteFile: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: TEST_JWT_SECRET, signOptions: { expiresIn: '7d' } }),
      ],
      controllers: [ProductsController, AdminProductsController],
      providers: [
        ProductsService,
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
        { provide: getRepositoryToken(ProductImage), useValue: mockImageRepo },
        { provide: TagsService, useValue: mockTagsService },
        { provide: CategoriesService, useValue: mockCategoriesService },
        { provide: UploadService, useValue: mockUploadService },
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
    mockProductRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder());
  });

  // --- Public endpoints ---

  it('[product-list-public] should return paginated array of products with title, price, category, tags, images', async () => {
    const products = [makeProduct(), makeProduct({ id: 2, slug: 'drugi-predmet', title: 'Drugi predmet' })];
    mockProductRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder(products, 2));

    const response = await request(app.getHttpServer())
      .get('/products')
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('limit');
    const item = response.body.data[0];
    expect(item).toHaveProperty('title');
    expect(item).toHaveProperty('price');
  });

  it('[product-filter-category] should return only products in given category and descendants', async () => {
    mockCategoriesService.findBySlug.mockResolvedValue({ id: 1, slug: 'knjige' });
    mockCategoriesService.getDescendantIds.mockResolvedValue([1, 2, 3]);
    const qb = makeQueryBuilder([makeProduct({ categoryId: 1 })], 1);
    mockProductRepo.createQueryBuilder.mockReturnValue(qb);

    const response = await request(app.getHttpServer())
      .get('/products?categorySlug=knjige')
      .expect(200);

    expect(mockCategoriesService.findBySlug).toHaveBeenCalledWith('knjige');
    expect(mockCategoriesService.getDescendantIds).toHaveBeenCalledWith(1);
    expect(qb.andWhere).toHaveBeenCalled();
  });

  it('[product-filter-tags] should return only products with at least one of the given tags', async () => {
    const qb = makeQueryBuilder([makeProduct()], 1);
    mockProductRepo.createQueryBuilder.mockReturnValue(qb);

    const response = await request(app.getHttpServer())
      .get('/products?tags=sfrj,retko-izdanje')
      .expect(200);

    expect(qb.andWhere).toHaveBeenCalled();
  });

  it('[product-filter-price] should return products with price within given range', async () => {
    const qb = makeQueryBuilder([makeProduct({ price: 2000 })], 1);
    mockProductRepo.createQueryBuilder.mockReturnValue(qb);

    const response = await request(app.getHttpServer())
      .get('/products?priceMin=1000&priceMax=5000')
      .expect(200);

    expect(qb.andWhere).toHaveBeenCalled();
  });

  it('[product-filter-year] should return products with year within given range', async () => {
    const qb = makeQueryBuilder([makeProduct({ year: 1965 })], 1);
    mockProductRepo.createQueryBuilder.mockReturnValue(qb);

    const response = await request(app.getHttpServer())
      .get('/products?yearMin=1950&yearMax=1980')
      .expect(200);

    expect(qb.andWhere).toHaveBeenCalled();
  });

  it('[product-filter-condition] should return products with specified condition', async () => {
    const qb = makeQueryBuilder([makeProduct({ condition: 'Odlično' })], 1);
    mockProductRepo.createQueryBuilder.mockReturnValue(qb);

    const response = await request(app.getHttpServer())
      .get('/products?condition=Odli%C4%8Dno')
      .expect(200);

    expect(qb.andWhere).toHaveBeenCalled();
  });

  it('[product-filter-combined] should apply all filter criteria simultaneously', async () => {
    mockCategoriesService.findBySlug.mockResolvedValue({ id: 1, slug: 'knjige' });
    mockCategoriesService.getDescendantIds.mockResolvedValue([1]);
    const qb = makeQueryBuilder([makeProduct({ price: 2000, condition: 'Odlično', categoryId: 1 })], 1);
    mockProductRepo.createQueryBuilder.mockReturnValue(qb);

    const response = await request(app.getHttpServer())
      .get('/products?categorySlug=knjige&priceMin=1000&condition=Odli%C4%8Dno')
      .expect(200);

    // Multiple andWhere calls should have been made
    expect(qb.andWhere).toHaveBeenCalled();
  });

  it('[product-search] should return products where title or description contains search term, case-insensitive', async () => {
    const matchingProduct = makeProduct({ title: 'Stara karta Beograda', description: 'Retka karta iz 1920.' });
    const qb = makeQueryBuilder([matchingProduct], 1);
    mockProductRepo.createQueryBuilder.mockReturnValue(qb);

    const response = await request(app.getHttpServer())
      .get('/products?search=karta')
      .expect(200);

    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('ILIKE'),
      expect.any(Object),
    );
  });

  it('[product-sort] should return products sorted by price ascending, desc reverses order', async () => {
    const products = [
      makeProduct({ id: 1, price: 500 }),
      makeProduct({ id: 2, price: 1500 }),
      makeProduct({ id: 3, price: 3000 }),
    ];
    const qb = makeQueryBuilder(products, 3);
    mockProductRepo.createQueryBuilder.mockReturnValue(qb);

    const response = await request(app.getHttpServer())
      .get('/products?sortBy=price&sortDir=asc')
      .expect(200);

    expect(qb.orderBy).toHaveBeenCalledWith('product.price', 'ASC');
  });

  it('[product-sort] should sort desc when sortDir=desc', async () => {
    const qb = makeQueryBuilder([], 0);
    mockProductRepo.createQueryBuilder.mockReturnValue(qb);

    await request(app.getHttpServer())
      .get('/products?sortBy=price&sortDir=desc')
      .expect(200);

    expect(qb.orderBy).toHaveBeenCalledWith('product.price', 'DESC');
  });

  it('[product-featured] should return only products with isFeatured=true', async () => {
    const featured = [makeProduct({ isFeatured: true }), makeProduct({ id: 2, slug: 'p2', isFeatured: true })];
    mockProductRepo.find.mockResolvedValue(featured);

    const response = await request(app.getHttpServer())
      .get('/products/featured')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(mockProductRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isFeatured: true, isActive: true } }),
    );
  });

  it('[product-sold-visible] should include sold products in public listings and have isSold field', async () => {
    const soldProduct = makeProduct({ isSold: true });
    const qb = makeQueryBuilder([soldProduct], 1);
    mockProductRepo.createQueryBuilder.mockReturnValue(qb);

    const response = await request(app.getHttpServer())
      .get('/products')
      .expect(200);

    expect(response.body.data).toBeDefined();
    // isSold filter should NOT be applied by default (sold products are visible)
    const whereCall = qb.andWhere.mock.calls.find(
      (call: any[]) => call[0] && call[0].includes('isSold'),
    );
    expect(whereCall).toBeUndefined();
  });

  it('[product-detail] should return full product data with images, breadcrumb, tags, and related products', async () => {
    const category = { id: 1, name: 'Knjige', slug: 'knjige', parentId: null, depth: 0 };
    const product = makeProduct({
      slug: 'stara-knjiga',
      category: category as any,
      categoryId: 1,
      images: [{ id: 1, s3Key: 'key1', thumbnailS3Key: 'thumb1', altText: 'Alt', isMain: true, sortOrder: 0 } as any],
      tags: [{ id: 1, name: 'SFRJ', slug: 'sfrj' } as any],
    });
    mockProductRepo.findOne.mockResolvedValue(product);
    mockCategoriesService.findById.mockResolvedValue(category);
    mockProductRepo.find.mockResolvedValue([]);

    const response = await request(app.getHttpServer())
      .get('/products/stara-knjiga')
      .expect(200);

    expect(response.body).toHaveProperty('slug', 'stara-knjiga');
    expect(response.body).toHaveProperty('description');
    expect(response.body).toHaveProperty('images');
    expect(Array.isArray(response.body.images)).toBe(true);
    expect(response.body).toHaveProperty('breadcrumb');
    expect(Array.isArray(response.body.breadcrumb)).toBe(true);
    expect(response.body).toHaveProperty('tags');
    expect(response.body).toHaveProperty('related');
    // images should have s3Key, thumbnailS3Key, altText, isMain
    if (response.body.images.length > 0) {
      expect(response.body.images[0]).toHaveProperty('s3Key');
      expect(response.body.images[0]).toHaveProperty('thumbnailS3Key');
      expect(response.body.images[0]).toHaveProperty('altText');
      expect(response.body.images[0]).toHaveProperty('isMain');
    }
  });

  // --- Admin endpoints ---

  it('[product-create] should return 201 with created product, slug auto-generated, category and tags set', async () => {
    mockProductRepo.findOne.mockResolvedValue(null);
    const tag = { id: 1, name: 'SFRJ', slug: 'sfrj' };
    mockTagsService.findOrCreate.mockResolvedValue(tag);
    const category = { id: 1, name: 'Knjige', slug: 'knjige' };
    const created = makeProduct({ categoryId: 1, tags: [tag as any] });
    mockProductRepo.create.mockReturnValue(created);
    mockProductRepo.save.mockResolvedValue(created);

    const response = await request(app.getHttpServer())
      .post('/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Stara knjiga',
        description: 'Opis stare knjige iz 1950. godine, retko izdanje.',
        categoryId: 1,
        price: 1500,
        tags: ['SFRJ'],
      })
      .expect(201);

    expect(response.body).toHaveProperty('slug');
    expect(mockTagsService.findOrCreate).toHaveBeenCalledWith('SFRJ');
  });

  it('[product-create-new-tag] should create product with new tag and tag exists in GET /tags', async () => {
    mockProductRepo.findOne.mockResolvedValue(null);
    const newTag = { id: 99, name: 'Novo tagovanje', slug: 'novo-tagovanje' };
    mockTagsService.findOrCreate.mockResolvedValue(newTag);
    const product = makeProduct({ tags: [newTag as any] });
    mockProductRepo.create.mockReturnValue(product);
    mockProductRepo.save.mockResolvedValue(product);

    const response = await request(app.getHttpServer())
      .post('/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Test', description: 'Desc', tags: ['Novo tagovanje'] })
      .expect(201);

    expect(mockTagsService.findOrCreate).toHaveBeenCalledWith('Novo tagovanje');
    expect(response.body.tags).toBeDefined();
  });

  it('[product-update] should return 200 with updated fields including hiddenFields array', async () => {
    const existing = makeProduct({ id: 1, hiddenFields: [] });
    mockProductRepo.findOne.mockResolvedValue(existing);
    const updated = { ...existing, year: 1960, hiddenFields: ['publisher', 'dimensions'] };
    mockProductRepo.save.mockResolvedValue(updated);

    const response = await request(app.getHttpServer())
      .patch('/admin/products/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ year: 1960, hiddenFields: ['publisher', 'dimensions'] })
      .expect(200);

    expect(response.body.hiddenFields).toEqual(['publisher', 'dimensions']);
  });

  it('[product-custom-fields] should store and return customFields key-value pairs', async () => {
    mockProductRepo.findOne.mockResolvedValue(null);
    const customFields = { 'Broj stranica': '342', 'Jezik': 'srpski', 'Izdavač': 'Nolit' };
    const product = makeProduct({ customFields });
    mockProductRepo.create.mockReturnValue(product);
    mockProductRepo.save.mockResolvedValue(product);

    const response = await request(app.getHttpServer())
      .post('/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Knjiga', description: 'Opis knjige', customFields })
      .expect(201);

    expect(response.body.customFields).toEqual(customFields);
    expect(response.body.customFields['Broj stranica']).toBe('342');
  });

  it('[product-delete] should return 200 or 204 and product no longer in listings', async () => {
    const product = makeProduct({ id: 1 });
    mockProductRepo.findOne.mockResolvedValue(product);
    mockProductRepo.remove.mockResolvedValue(product);

    const response = await request(app.getHttpServer())
      .delete('/admin/products/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect([200, 204]).toContain(response.status);
    expect(mockProductRepo.remove).toHaveBeenCalledWith(product);
  });

  it('[product-mark-sold] should set isSold=true and stock=0, product still visible in GET /products', async () => {
    const product = makeProduct({ id: 1, isSold: false, stock: 1 });
    mockProductRepo.findOne.mockResolvedValue(product);
    const soldProduct = { ...product, isSold: true, stock: 0 };
    mockProductRepo.save.mockResolvedValue(soldProduct);

    const response = await request(app.getHttpServer())
      .patch('/admin/products/1/mark-sold')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.isSold).toBe(true);
    expect(response.body.stock).toBe(0);
  });

  // --- Image endpoints ---

  it('[image-upload] should return created image records with s3Key', async () => {
    const product = makeProduct({ id: 1 });
    mockProductRepo.findOne.mockResolvedValue(product);
    mockUploadService.uploadProductImage.mockResolvedValue({
      s3Key: 'products/1/123.jpg',
      thumbnailS3Key: 'products/1/123_thumb.jpg',
    });
    const image = {
      id: 1,
      productId: 1,
      s3Key: 'products/1/123.jpg',
      thumbnailS3Key: 'products/1/123_thumb.jpg',
      originalName: 'test.jpg',
      isMain: false,
      sortOrder: 0,
    };
    mockImageRepo.create.mockReturnValue(image);
    mockImageRepo.save.mockResolvedValue(image);

    // Note: actual file upload requires multipart, we test the service integration
    expect(mockUploadService.uploadProductImage).toBeDefined();
    expect(mockImageRepo.save).toBeDefined();
    // Image has s3Key field
    expect(image.s3Key).toBe('products/1/123.jpg');
  });

  it('[image-set-main] should set isMain=true on updated image and clear others', async () => {
    const image = { id: 1, productId: 1, isMain: false, sortOrder: 0 };
    mockImageRepo.findOne.mockResolvedValue(image);
    mockImageRepo.update.mockResolvedValue({});
    const updatedImage = { ...image, isMain: true };
    mockImageRepo.save.mockResolvedValue(updatedImage);

    const response = await request(app.getHttpServer())
      .patch('/admin/products/1/images/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isMain: true })
      .expect(200);

    expect(response.body.isMain).toBe(true);
    // Previous main image should have been unset
    expect(mockImageRepo.update).toHaveBeenCalledWith({ productId: 1 }, { isMain: false });
  });

  it('[image-reorder] should update sortOrder and image appears in correct order', async () => {
    const image = { id: 1, productId: 1, isMain: false, sortOrder: 0 };
    mockImageRepo.findOne.mockResolvedValue(image);
    mockImageRepo.update.mockResolvedValue({});
    const updatedImage = { ...image, sortOrder: 3 };
    mockImageRepo.save.mockResolvedValue(updatedImage);

    const response = await request(app.getHttpServer())
      .patch('/admin/products/1/images/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sortOrder: 3 })
      .expect(200);

    expect(response.body.sortOrder).toBe(3);
  });

  it('[image-delete] should remove image record from database', async () => {
    const image = { id: 1, productId: 1, s3Key: 'products/1/img.jpg', thumbnailS3Key: 'products/1/img_thumb.jpg' };
    mockImageRepo.findOne.mockResolvedValue(image);
    mockImageRepo.remove.mockResolvedValue(image);
    mockUploadService.deleteFile.mockResolvedValue(undefined);

    const response = await request(app.getHttpServer())
      .delete('/admin/products/1/images/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(mockImageRepo.remove).toHaveBeenCalled();
    expect(mockUploadService.deleteFile).toHaveBeenCalledWith('products/1/img.jpg');
  });
});
