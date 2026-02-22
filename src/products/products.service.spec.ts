import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { TagsService } from '../tags/tags.service';
import { CategoriesService } from '../categories/categories.service';

const makeQueryBuilder = () => {
  const qb: any = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };
  return qb;
};

const mockProductRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(() => makeQueryBuilder()),
});

const mockImageRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
});

const mockTagsService = () => ({
  findOrCreate: jest.fn(),
});

const mockCategoriesService = () => ({
  findBySlug: jest.fn(),
  getDescendantIds: jest.fn(),
  findById: jest.fn(),
});

const makeProduct = (overrides: Partial<Product> = {}): Product =>
  ({
    id: 1,
    title: 'Test Product',
    slug: 'test-product',
    description: 'A great product',
    shortDescription: null,
    price: 100,
    priceOnRequest: false,
    year: 1950,
    condition: 'good',
    origin: null,
    dimensions: null,
    material: null,
    author: null,
    publisher: null,
    period: null,
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

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepo: ReturnType<typeof mockProductRepository>;
  let imageRepo: ReturnType<typeof mockImageRepository>;
  let tagsService: ReturnType<typeof mockTagsService>;
  let categoriesService: ReturnType<typeof mockCategoriesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useFactory: mockProductRepository },
        { provide: getRepositoryToken(ProductImage), useFactory: mockImageRepository },
        { provide: TagsService, useFactory: mockTagsService },
        { provide: CategoriesService, useFactory: mockCategoriesService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepo = module.get(getRepositoryToken(Product));
    imageRepo = module.get(getRepositoryToken(ProductImage));
    tagsService = module.get(TagsService);
    categoriesService = module.get(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const products = [makeProduct()];
      const qb = makeQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([products, 1]);
      productRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should apply search filter', async () => {
      const qb = makeQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      productRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({ search: 'antique' });
      expect(qb.andWhere).toHaveBeenCalled();
    });

    it('should apply categorySlug filter', async () => {
      const category = { id: 1, slug: 'test-cat' };
      categoriesService.findBySlug.mockResolvedValue(category);
      categoriesService.getDescendantIds.mockResolvedValue([1, 2]);

      const qb = makeQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      productRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({ categorySlug: 'test-cat' });
      expect(categoriesService.findBySlug).toHaveBeenCalledWith('test-cat');
      expect(qb.andWhere).toHaveBeenCalled();
    });

    it('should use default page and limit', async () => {
      const qb = makeQueryBuilder();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      productRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('findFeatured', () => {
    it('should return featured active products', async () => {
      const featured = [makeProduct({ isFeatured: true })];
      productRepo.find.mockResolvedValue(featured);
      const result = await service.findFeatured();
      expect(result).toEqual(featured);
      expect(productRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isFeatured: true, isActive: true } }),
      );
    });
  });

  describe('findBySlug', () => {
    it('should return product with breadcrumb and related products', async () => {
      const category = { id: 1, name: 'Cat', slug: 'cat', parentId: null };
      const product = makeProduct({ slug: 'test-product', category: category as any, categoryId: 1 });
      productRepo.findOne.mockResolvedValueOnce(product); // findBySlug
      categoriesService.findById.mockResolvedValue(category);
      productRepo.find.mockResolvedValue([product, makeProduct({ id: 2, slug: 'other' })]); // related

      const result = await service.findBySlug('test-product');
      expect(result.slug).toBe('test-product');
      expect(result.breadcrumb).toHaveLength(1);
      expect(result.breadcrumb[0].slug).toBe('cat');
      expect(Array.isArray(result.related)).toBe(true);
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepo.findOne.mockResolvedValue(null);
      await expect(service.findBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return product when found', async () => {
      const product = makeProduct({ id: 5 });
      productRepo.findOne.mockResolvedValue(product);
      const result = await service.findById(5);
      expect(result).toEqual(product);
    });

    it('should throw NotFoundException when not found', async () => {
      productRepo.findOne.mockResolvedValue(null);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create product with auto slug', async () => {
      productRepo.findOne.mockResolvedValue(null); // slug not taken
      tagsService.findOrCreate.mockResolvedValue({ id: 1, name: 'Tag', slug: 'tag' });

      const product = makeProduct({ title: 'New Product', slug: 'new-product' });
      productRepo.create.mockReturnValue(product);
      productRepo.save.mockResolvedValue(product);

      const result = await service.create({ title: 'New Product', description: 'Desc', tags: ['Tag'] });
      expect(result.slug).toBe('new-product');
      expect(tagsService.findOrCreate).toHaveBeenCalledWith('Tag');
    });

    it('should throw BadRequestException if slug already taken', async () => {
      productRepo.findOne.mockResolvedValue(makeProduct());
      await expect(service.create({ title: 'Test', description: 'Desc' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update product fields', async () => {
      const product = makeProduct({ id: 1 });
      productRepo.findOne.mockResolvedValue(product);
      productRepo.save.mockResolvedValue({ ...product, title: 'Updated' });

      const result = await service.update(1, { title: 'Updated' });
      expect(productRepo.save).toHaveBeenCalled();
    });

    it('should update tags when provided', async () => {
      const product = makeProduct({ id: 1, tags: [] });
      productRepo.findOne.mockResolvedValue(product);
      const newTag = { id: 2, name: 'NewTag', slug: 'newtag' };
      tagsService.findOrCreate.mockResolvedValue(newTag);
      productRepo.save.mockResolvedValue({ ...product, tags: [newTag] });

      await service.update(1, { tags: ['NewTag'] });
      expect(tagsService.findOrCreate).toHaveBeenCalledWith('NewTag');
    });
  });

  describe('remove', () => {
    it('should remove product', async () => {
      const product = makeProduct({ id: 1 });
      productRepo.findOne.mockResolvedValue(product);
      productRepo.remove.mockResolvedValue(product);

      await service.remove(1);
      expect(productRepo.remove).toHaveBeenCalledWith(product);
    });
  });

  describe('markSold', () => {
    it('should mark product as sold and set stock to 0', async () => {
      const product = makeProduct({ id: 1, isSold: false, stock: 5 });
      productRepo.findOne.mockResolvedValue(product);
      productRepo.save.mockResolvedValue({ ...product, isSold: true, stock: 0 });

      const result = await service.markSold(1);
      expect(productRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isSold: true, stock: 0 }));
    });
  });

  describe('addImage', () => {
    it('should add image to product', async () => {
      const product = makeProduct({ id: 1 });
      productRepo.findOne.mockResolvedValue(product);
      const image = { id: 1, productId: 1, s3Key: 'key', isMain: false } as any;
      imageRepo.create.mockReturnValue(image);
      imageRepo.save.mockResolvedValue(image);

      const result = await service.addImage(1, { s3Key: 'key', isMain: false });
      expect(imageRepo.save).toHaveBeenCalled();
      expect(result.productId).toBe(1);
    });
  });

  describe('updateImage', () => {
    it('should update image and unset other main images when setting isMain', async () => {
      const image = { id: 1, productId: 1, isMain: false } as any;
      imageRepo.findOne.mockResolvedValue(image);
      imageRepo.update.mockResolvedValue({});
      imageRepo.save.mockResolvedValue({ ...image, isMain: true });

      await service.updateImage(1, 1, { isMain: true });
      expect(imageRepo.update).toHaveBeenCalledWith({ productId: 1 }, { isMain: false });
    });

    it('should throw NotFoundException when image not found', async () => {
      imageRepo.findOne.mockResolvedValue(null);
      await expect(service.updateImage(1, 999, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeImage', () => {
    it('should remove image and return it', async () => {
      const image = { id: 1, productId: 1 } as any;
      imageRepo.findOne.mockResolvedValue(image);
      imageRepo.remove.mockResolvedValue(image);

      const result = await service.removeImage(1, 1);
      expect(imageRepo.remove).toHaveBeenCalledWith(image);
      expect(result).toEqual(image);
    });
  });
});
