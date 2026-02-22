import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { BulkImportCategoryItemDto } from './dto/bulk-import-category.dto';
import { slugify } from '../common/utils/slugify';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async findTree(): Promise<any[]> {
    const all = await this.categoryRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    let countMap = new Map<number, number>();
    try {
      const countRows = await this.categoryRepository.manager.query(
        `SELECT "categoryId", COUNT(*) as count FROM product WHERE "isActive" = true AND "categoryId" IS NOT NULL GROUP BY "categoryId"`,
      );
      countMap = new Map<number, number>(
        countRows.map((r: any) => [Number(r.categoryId), Number(r.count)]),
      );
    } catch {
      // Table might not exist yet during init
    }

    return this.buildTree(
      all.map((c) => ({ ...c, productCount: countMap.get(c.id) || 0 })),
      null,
    );
  }

  private buildTree(categories: any[], parentId: number | null): any[] {
    return categories
      .filter((c) => c.parentId === parentId)
      .map((c) => ({
        ...c,
        children: this.buildTree(categories, c.id),
      }));
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { slug, isActive: true },
    });
    if (!category) throw new NotFoundException(`Category with slug "${slug}" not found`);
    return category;
  }

  async findBySlugWithProducts(
    slug: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ category: Category; products: any[]; total: number; page: number; limit: number }> {
    const category = await this.findBySlug(slug);
    const descendantIds = await this.getDescendantIds(category.id);
    const skip = (page - 1) * limit;

    let products: any[] = [];
    let total = 0;
    try {
      const countRow = await this.categoryRepository.manager.query(
        `SELECT COUNT(*) as total FROM product WHERE "categoryId" = ANY($1) AND "isActive" = true`,
        [descendantIds],
      );
      total = Number(countRow[0]?.total || 0);
      products = await this.categoryRepository.manager.query(
        `SELECT p.* FROM product p WHERE p."categoryId" = ANY($1) AND p."isActive" = true ORDER BY p."sortOrder" ASC, p."createdAt" DESC LIMIT $2 OFFSET $3`,
        [descendantIds, limit, skip],
      );
    } catch {
      // Table might not exist yet
    }

    return { category, products, total, page, limit };
  }

  async findById(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException(`Category #${id} not found`);
    return category;
  }

  async getDescendantIds(categoryId: number): Promise<number[]> {
    const all = await this.categoryRepository.find();
    const ids: number[] = [categoryId];
    const queue = [categoryId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = all.filter((c) => c.parentId === current);
      for (const child of children) {
        ids.push(child.id);
        queue.push(child.id);
      }
    }
    return ids;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = dto.slug || slugify(dto.name);
    const existing = await this.categoryRepository.findOne({ where: { slug } });
    if (existing) throw new BadRequestException(`Slug "${slug}" already exists`);

    let depth = 0;
    if (dto.parentId) {
      const parent = await this.findById(dto.parentId);
      depth = parent.depth + 1;
    }

    const category = this.categoryRepository.create({ ...dto, slug, depth });
    return this.categoryRepository.save(category);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(id);
    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.categoryRepository.findOne({ where: { slug: dto.slug } });
      if (existing) throw new BadRequestException(`Slug "${dto.slug}" already exists`);
    }
    if (dto.name && !dto.slug) {
      dto.slug = slugify(dto.name);
    }
    if (dto.parentId !== undefined) {
      if (dto.parentId === id) throw new BadRequestException('Category cannot be its own parent');
      let depth = 0;
      if (dto.parentId) {
        const parent = await this.findById(dto.parentId);
        depth = parent.depth + 1;
      }
      Object.assign(category, { ...dto, depth });
    } else {
      Object.assign(category, dto);
    }
    return this.categoryRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findById(id);
    const childCount = await this.categoryRepository.count({ where: { parentId: id } });
    if (childCount > 0) throw new BadRequestException('Cannot delete category with subcategories');
    await this.categoryRepository.remove(category);
  }

  async bulkImport(categories: BulkImportCategoryItemDto[], mode: string): Promise<void> {
    if (mode === 'replace') {
      await this.categoryRepository.delete({ parentId: Not(IsNull()) });
      await this.categoryRepository.delete({ parentId: IsNull() });
    }
    await this.importTree(categories, null, 0);
  }

  private async importTree(
    items: BulkImportCategoryItemDto[],
    parentId: number | null,
    depth: number,
  ): Promise<void> {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const slug = item.slug || slugify(item.name);
      let category = await this.categoryRepository.findOne({ where: { slug } });
      if (!category) {
        category = this.categoryRepository.create({
          name: item.name,
          slug,
          description: item.description,
          iconName: item.iconName,
          parentId: parentId ?? undefined,
          depth,
          sortOrder: i,
        });
        category = await this.categoryRepository.save(category);
      } else {
        category.name = item.name;
        if (item.description !== undefined) category.description = item.description;
        if (item.iconName !== undefined) category.iconName = item.iconName;
        category.depth = depth;
        category.sortOrder = i;
        if (parentId !== null) category.parentId = parentId;
        category = await this.categoryRepository.save(category);
      }
      if (item.children && item.children.length > 0) {
        await this.importTree(item.children, category.id, depth + 1);
      }
    }
  }

  async exportTree(): Promise<any[]> {
    const all = await this.categoryRepository.find({ order: { sortOrder: 'ASC' } });
    return this.buildExportTree(all, null);
  }

  private buildExportTree(categories: Category[], parentId: number | null): any[] {
    return categories
      .filter((c) => c.parentId === parentId)
      .map((c) => ({
        name: c.name,
        slug: c.slug,
        description: c.description,
        iconName: c.iconName,
        children: this.buildExportTree(categories, c.id),
      }));
  }
}
