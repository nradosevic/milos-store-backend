import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { TagsService } from '../tags/tags.service';
import { CategoriesService } from '../categories/categories.service';
import { slugify } from '../common/utils/slugify';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private imageRepository: Repository<ProductImage>,
    private tagsService: TagsService,
    private categoriesService: CategoriesService,
  ) {}

  async findAll(query: QueryProductsDto): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    let qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.tags', 'tags')
      .addOrderBy('images.sortOrder', 'ASC')
      .where('product.isActive = :isActive', { isActive: true });

    if (query.search) {
      qb = qb.andWhere(
        '(product.title ILIKE :search OR product.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.categorySlug) {
      const category = await this.categoriesService.findBySlug(query.categorySlug);
      const categoryIds = await this.categoriesService.getDescendantIds(category.id);
      qb = qb.andWhere('product.categoryId IN (:...categoryIds)', { categoryIds });
    }

    if (query.tags) {
      const tagSlugs = query.tags.split(',').map((t) => t.trim());
      qb = qb.andWhere('tags.slug IN (:...tagSlugs)', { tagSlugs });
    }

    if (query.yearMin) qb = qb.andWhere('product.year >= :yearMin', { yearMin: query.yearMin });
    if (query.yearMax) qb = qb.andWhere('product.year <= :yearMax', { yearMax: query.yearMax });
    if (query.condition) qb = qb.andWhere('product.condition = :condition', { condition: query.condition });
    if (query.priceMin) qb = qb.andWhere('product.price >= :priceMin', { priceMin: query.priceMin });
    if (query.priceMax) qb = qb.andWhere('product.price <= :priceMax', { priceMax: query.priceMax });
    if (query.isUnique !== undefined) qb = qb.andWhere('product.isUnique = :isUnique', { isUnique: query.isUnique });
    if (query.isSold !== undefined) qb = qb.andWhere('product.isSold = :isSold', { isSold: query.isSold });

    const dir = (query.sortDir?.toLowerCase() === 'desc' ? 'DESC' : 'ASC') as 'ASC' | 'DESC';
    if (query.sortBy === 'price') qb = qb.orderBy('product.price', dir);
    else if (query.sortBy === 'year') qb = qb.orderBy('product.year', dir);
    else if (query.sortBy === 'createdAt') qb = qb.orderBy('product.createdAt', dir);
    else if (query.sortBy === 'title') qb = qb.orderBy('product.title', dir);
    else {
      qb = qb.orderBy('product.sortOrder', 'ASC').addOrderBy('product.createdAt', 'DESC');
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
    return { data, total, page, limit };
  }

  async autocomplete(q: string): Promise<{ id: number; title: string; slug: string; image: string | null }[]> {
    if (!q || q.trim().length < 2) return [];
    const products = await this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images', 'images.isMain = true')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.title ILIKE :q', { q: `%${q.trim()}%` })
      .orderBy('product.title', 'ASC')
      .take(8)
      .getMany();
    return products.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      image: p.images?.[0]?.thumbnailS3Key || p.images?.[0]?.s3Key || null,
    }));
  }

  async findPopular(limit: number = 10): Promise<Product[]> {
    return this.productRepository.find({
      where: { isActive: true, isSold: false },
      relations: ['images', 'category'],
      order: { viewCount: 'DESC' },
      take: limit,
    });
  }

  async findFeatured(): Promise<Product[]> {
    return this.productRepository.find({
      where: { isFeatured: true, isActive: true },
      relations: ['images', 'category'],
      order: { sortOrder: 'ASC' },
    });
  }

  async findBySlug(slug: string): Promise<Product & { breadcrumb: any[]; related: Product[] }> {
    const product = await this.productRepository.findOne({
      where: { slug, isActive: true },
      relations: ['images', 'category', 'tags'],
    });
    if (!product) throw new NotFoundException(`Product with slug "${slug}" not found`);

    // Track view count (fire and forget, don't block the response)
    this.productRepository.increment({ id: product.id }, 'viewCount', 1).catch(() => {});

    const breadcrumb: any[] = [];
    if (product.category) {
      let cat: any = product.category;
      while (cat) {
        breadcrumb.unshift({ id: cat.id, name: cat.name, slug: cat.slug });
        if (cat.parentId) {
          cat = await this.categoriesService.findById(cat.parentId).catch(() => null);
        } else {
          cat = null;
        }
      }
    }

    const related = await this.productRepository.find({
      where: { categoryId: product.categoryId, isActive: true, isSold: false },
      relations: ['images'],
      take: 4,
      order: { sortOrder: 'ASC' },
    });

    return { ...product, breadcrumb, related: related.filter((r) => r.id !== product.id) };
  }

  async findById(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['images', 'category', 'tags'],
    });
    if (!product) throw new NotFoundException(`Product #${id} not found`);
    return product;
  }

  private async resolveTags(dto: CreateProductDto | UpdateProductDto): Promise<import('../tags/entities/tag.entity').Tag[] | undefined> {
    if (dto.tagIds !== undefined && dto.tagIds.length > 0) {
      return this.tagsService.findByIds(dto.tagIds);
    }
    if (dto.tags !== undefined) {
      return Promise.all(dto.tags.map((name) => this.tagsService.findOrCreate(name)));
    }
    return undefined;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const slug = dto.slug || slugify(dto.title);
    const existing = await this.productRepository.findOne({ where: { slug } });
    if (existing) throw new BadRequestException(`Slug "${slug}" already exists`);

    const tags = (await this.resolveTags(dto)) || [];

    const { tags: _t, tagIds: _ti, ...rest } = dto;
    const product = this.productRepository.create({
      ...rest,
      slug,
      tags,
    });
    return this.productRepository.save(product);
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findById(id);

    if (dto.slug && dto.slug !== product.slug) {
      const existing = await this.productRepository.findOne({ where: { slug: dto.slug } });
      if (existing) throw new BadRequestException(`Slug "${dto.slug}" already exists`);
    }
    if (dto.title && !dto.slug) {
      dto.slug = slugify(dto.title);
    }

    const resolvedTags = await this.resolveTags(dto);
    if (resolvedTags !== undefined) {
      product.tags = resolvedTags;
    }

    const { tags, tagIds, ...rest } = dto;

    // Use a plain update query for the scalar fields to avoid TypeORM
    // relation conflicts (loaded category object overriding categoryId)
    await this.productRepository.update(product.id, rest);

    // Save tags separately since they're a many-to-many relation
    if (resolvedTags !== undefined) {
      await this.productRepository.save(product);
    }

    return this.findById(product.id);
  }

  async reorderFeatured(productIds: number[]): Promise<void> {
    for (let i = 0; i < productIds.length; i++) {
      await this.productRepository.update(productIds[i], { sortOrder: i });
    }
  }

  async remove(id: number): Promise<void> {
    const product = await this.findById(id);
    await this.productRepository.remove(product);
  }

  async markSold(id: number): Promise<Product> {
    const product = await this.findById(id);
    product.isSold = true;
    product.stock = 0;
    return this.productRepository.save(product);
  }

  async getImageCount(productId: number): Promise<number> {
    return this.imageRepository.count({ where: { productId } });
  }

  async hasMainImage(productId: number): Promise<boolean> {
    const main = await this.imageRepository.findOne({ where: { productId, isMain: true } });
    return !!main;
  }

  async addImage(productId: number, imageData: Partial<ProductImage>): Promise<ProductImage> {
    await this.findById(productId);
    const image = this.imageRepository.create({ ...imageData, productId });
    return this.imageRepository.save(image);
  }

  async reorderImages(productId: number, imageIds: number[]): Promise<ProductImage[]> {
    await this.findById(productId);
    const images: ProductImage[] = [];
    for (let i = 0; i < imageIds.length; i++) {
      const image = await this.imageRepository.findOne({ where: { id: imageIds[i], productId } });
      if (!image) throw new NotFoundException(`Image #${imageIds[i]} not found`);
      image.sortOrder = i;
      image.isMain = i === 0;
      images.push(await this.imageRepository.save(image));
    }
    // Unset isMain on any images not in the list
    await this.imageRepository
      .createQueryBuilder()
      .update()
      .set({ isMain: false })
      .where('productId = :productId AND id NOT IN (:...imageIds)', { productId, imageIds })
      .execute()
      .catch(() => {});
    return images;
  }

  async updateImage(productId: number, imageId: number, data: Partial<ProductImage>): Promise<ProductImage> {
    const image = await this.imageRepository.findOne({ where: { id: imageId, productId } });
    if (!image) throw new NotFoundException(`Image #${imageId} not found`);
    if (data.isMain) {
      await this.imageRepository.update({ productId }, { isMain: false });
    }
    Object.assign(image, data);
    return this.imageRepository.save(image);
  }

  async findImage(productId: number, imageId: number): Promise<ProductImage> {
    const image = await this.imageRepository.findOne({ where: { id: imageId, productId } });
    if (!image) throw new NotFoundException(`Image #${imageId} not found`);
    return image;
  }

  async removeImage(productId: number, imageId: number): Promise<ProductImage> {
    const image = await this.findImage(productId, imageId);
    await this.imageRepository.remove(image);
    return image;
  }
}
