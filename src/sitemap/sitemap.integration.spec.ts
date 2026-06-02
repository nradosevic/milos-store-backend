import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { SitemapController } from './sitemap.controller';
import { SitemapService } from './sitemap.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { ConfigService } from '@nestjs/config';

const TEST_JWT_SECRET = 'test-jwt-secret';

describe('Sitemap Integration Tests', () => {
  let app: INestApplication;

  const mockProductRepo = {
    find: jest.fn(),
  };
  const mockCategoryRepo = {
    find: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: TEST_JWT_SECRET, signOptions: { expiresIn: '7d' } }),
      ],
      controllers: [SitemapController],
      providers: [
        SitemapService,
        JwtStrategy,
        JwtAuthGuard,
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, def?: any) => {
              const cfg: Record<string, string> = {
                JWT_SECRET: TEST_JWT_SECRET,
                S3_PUBLIC_URL: 'https://cdn.example.com',
              };
              return cfg[key] ?? def;
            },
          },
        },
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
        { provide: getRepositoryToken(Category), useValue: mockCategoryRepo },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('[sitemap-generation] should return valid XML with product and category URLs', async () => {
    const products = [
      { slug: 'stara-knjiga', title: 'Stara Knjiga', updatedAt: new Date('2024-01-01'), images: [] },
      { slug: 'stari-sat', title: 'Stari Sat', updatedAt: new Date('2024-01-02'), images: [] },
    ];
    const categories = [
      { slug: 'knjige', updatedAt: new Date('2024-01-01') },
      { slug: 'satovi', updatedAt: new Date('2024-01-01') },
    ];
    mockProductRepo.find.mockResolvedValue(products);
    mockCategoryRepo.find.mockResolvedValue(categories);

    const response = await request(app.getHttpServer())
      .get('/sitemap.xml')
      .expect(200);

    expect(response.headers['content-type']).toContain('application/xml');
    expect(response.text).toContain('<?xml version="1.0"');
    expect(response.text).toContain('<urlset');
    expect(response.text).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
    expect(response.text).toContain('stara-knjiga');
    expect(response.text).toContain('stari-sat');
    expect(response.text).toContain('knjige');
    expect(response.text).toContain('satovi');
  });

  it('[sitemap-generation] should include image:image blocks for products with images', async () => {
    const products = [
      {
        slug: 'srpska-vaza',
        title: 'Srpska Vaza & Co',
        updatedAt: new Date('2024-01-01'),
        images: [
          { s3Key: 'products/1/a.jpg', altText: 'Vaza front', isMain: true, sortOrder: 1 },
          { s3Key: 'products/1/b.jpg', altText: null, isMain: false, sortOrder: 2 },
        ],
      },
    ];
    mockProductRepo.find.mockResolvedValue(products);
    mockCategoryRepo.find.mockResolvedValue([]);

    const response = await request(app.getHttpServer())
      .get('/sitemap.xml')
      .expect(200);

    expect(response.text).toContain('<image:image>');
    expect(response.text).toContain('https://cdn.example.com/products/1/a.jpg');
    expect(response.text).toContain('https://cdn.example.com/products/1/b.jpg');
    expect(response.text).toContain('<image:title>Srpska Vaza &amp; Co</image:title>');
    expect(response.text).toContain('<image:caption>Vaza front</image:caption>');
  });

  it('[sitemap-generation] should include URLs for all active products and categories', async () => {
    const products = [
      { slug: 'produkt-1', title: 'P1', updatedAt: new Date(), images: [] },
      { slug: 'produkt-2', title: 'P2', updatedAt: new Date(), images: [] },
      { slug: 'produkt-3', title: 'P3', updatedAt: new Date(), images: [] },
    ];
    const categories = [
      { slug: 'kat-1', updatedAt: new Date() },
    ];
    mockProductRepo.find.mockResolvedValue(products);
    mockCategoryRepo.find.mockResolvedValue(categories);

    const response = await request(app.getHttpServer())
      .get('/sitemap.xml')
      .expect(200);

    // All 3 product URLs present
    expect(response.text).toContain('produkt-1');
    expect(response.text).toContain('produkt-2');
    expect(response.text).toContain('produkt-3');
    // Category URL present
    expect(response.text).toContain('kat-1');
  });
});
