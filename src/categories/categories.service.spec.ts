import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';

const mockCategoryRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  delete: jest.fn(),
});

const makeCategory = (overrides: Partial<Category> = {}): Category =>
  ({
    id: 1,
    name: 'Test',
    slug: 'test',
    description: null,
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

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repo: ReturnType<typeof mockCategoryRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useFactory: mockCategoryRepository },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repo = module.get(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findTree', () => {
    it('should return nested tree of active categories', async () => {
      const parent = makeCategory({ id: 1, name: 'Parent', slug: 'parent', parentId: null });
      const child = makeCategory({ id: 2, name: 'Child', slug: 'child', parentId: 1, depth: 1 });
      repo.find.mockResolvedValue([parent, child]);

      const result = await service.findTree();
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('parent');
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].slug).toBe('child');
    });

    it('should return empty array when no active categories', async () => {
      repo.find.mockResolvedValue([]);
      const result = await service.findTree();
      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return all categories ordered', async () => {
      const categories = [makeCategory({ id: 1 }), makeCategory({ id: 2 })];
      repo.find.mockResolvedValue(categories);
      const result = await service.findAll();
      expect(result).toEqual(categories);
      expect(repo.find).toHaveBeenCalledWith({ order: { sortOrder: 'ASC', name: 'ASC' } });
    });
  });

  describe('findBySlug', () => {
    it('should return category when found', async () => {
      const cat = makeCategory({ slug: 'my-cat' });
      repo.findOne.mockResolvedValue(cat);
      const result = await service.findBySlug('my-cat');
      expect(result).toEqual(cat);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return category when found', async () => {
      const cat = makeCategory({ id: 5 });
      repo.findOne.mockResolvedValue(cat);
      const result = await service.findById(5);
      expect(result).toEqual(cat);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDescendantIds', () => {
    it('should return all descendant IDs including itself', async () => {
      const all = [
        makeCategory({ id: 1, parentId: null }),
        makeCategory({ id: 2, parentId: 1 }),
        makeCategory({ id: 3, parentId: 2 }),
        makeCategory({ id: 4, parentId: null }),
      ];
      repo.find.mockResolvedValue(all);
      const result = await service.getDescendantIds(1);
      expect(result).toContain(1);
      expect(result).toContain(2);
      expect(result).toContain(3);
      expect(result).not.toContain(4);
    });
  });

  describe('create', () => {
    it('should create category with auto slug', async () => {
      repo.findOne.mockResolvedValue(null); // slug not taken
      const cat = makeCategory({ name: 'New Category', slug: 'new-category' });
      repo.create.mockReturnValue(cat);
      repo.save.mockResolvedValue(cat);

      const result = await service.create({ name: 'New Category' });
      expect(result.slug).toBe('new-category');
      expect(repo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if slug already exists', async () => {
      repo.findOne.mockResolvedValue(makeCategory()); // slug taken
      await expect(service.create({ name: 'Test' })).rejects.toThrow(BadRequestException);
    });

    it('should set depth based on parent', async () => {
      const parent = makeCategory({ id: 10, depth: 1 });
      // First findOne for slug check returns null (not taken)
      // Second findOne for findById (parent lookup)
      repo.findOne
        .mockResolvedValueOnce(null) // slug not taken
        .mockResolvedValueOnce(parent); // parent found

      const child = makeCategory({ depth: 2, parentId: 10 });
      repo.create.mockReturnValue(child);
      repo.save.mockResolvedValue(child);

      const result = await service.create({ name: 'Child', parentId: 10 });
      expect(result.depth).toBe(2);
    });
  });

  describe('update', () => {
    it('should update category fields', async () => {
      const cat = makeCategory({ id: 1, name: 'Old', slug: 'old' });
      repo.findOne.mockResolvedValue(cat);
      const updated = { ...cat, name: 'Updated' };
      repo.save.mockResolvedValue(updated);

      const result = await service.update(1, { name: 'Updated' });
      expect(repo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if category tries to be its own parent', async () => {
      const cat = makeCategory({ id: 1 });
      repo.findOne.mockResolvedValue(cat);
      await expect(service.update(1, { parentId: 1 })).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should remove category with no children', async () => {
      const cat = makeCategory({ id: 1 });
      repo.findOne.mockResolvedValue(cat);
      repo.count.mockResolvedValue(0);
      repo.remove.mockResolvedValue(cat);

      await service.remove(1);
      expect(repo.remove).toHaveBeenCalledWith(cat);
    });

    it('should throw BadRequestException when category has children', async () => {
      const cat = makeCategory({ id: 1 });
      repo.findOne.mockResolvedValue(cat);
      repo.count.mockResolvedValue(3);

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('bulkImport', () => {
    it('should merge categories without deleting existing', async () => {
      repo.findOne.mockResolvedValue(null); // no existing slug
      const cat = makeCategory({ id: 1, name: 'Root', slug: 'root' });
      repo.create.mockReturnValue(cat);
      repo.save.mockResolvedValue(cat);

      await service.bulkImport([{ name: 'Root', slug: 'root' }], 'merge');
      expect(repo.delete).not.toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
    });

    it('should delete all categories in replace mode before importing', async () => {
      repo.delete.mockResolvedValue({});
      repo.findOne.mockResolvedValue(null);
      const cat = makeCategory({ id: 1 });
      repo.create.mockReturnValue(cat);
      repo.save.mockResolvedValue(cat);

      await service.bulkImport([{ name: 'Root', slug: 'root' }], 'replace');
      expect(repo.delete).toHaveBeenCalledTimes(2);
    });
  });

  describe('exportTree', () => {
    it('should return export-formatted tree', async () => {
      const parent = makeCategory({ id: 1, name: 'Parent', slug: 'parent', parentId: null });
      const child = makeCategory({ id: 2, name: 'Child', slug: 'child', parentId: 1 });
      repo.find.mockResolvedValue([parent, child]);

      const result = await service.exportTree();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Parent');
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].name).toBe('Child');
      // Export format should only have specific fields
      expect(result[0]).not.toHaveProperty('id');
    });
  });
});
