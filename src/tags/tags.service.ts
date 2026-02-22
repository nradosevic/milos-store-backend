import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { slugify } from '../common/utils/slugify';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
  ) {}

  async findAll(): Promise<Tag[]> {
    return this.tagRepository
      .createQueryBuilder('tag')
      .loadRelationCountAndMap('tag.productCount', 'tag.products')
      .orderBy('tag.name', 'ASC')
      .getMany();
  }

  async findBySlug(slug: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { slug } });
    if (!tag) throw new NotFoundException(`Tag with slug "${slug}" not found`);
    return tag;
  }

  async findBySlugWithProducts(
    slug: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ tag: Tag; products: any[]; total: number; page: number; limit: number }> {
    const tag = await this.findBySlug(slug);
    const skip = (page - 1) * limit;

    let products: any[] = [];
    let total = 0;
    try {
      const countRow = await this.tagRepository.manager.query(
        `SELECT COUNT(*) as total FROM product p
         INNER JOIN product_tags pt ON pt."productId" = p.id
         WHERE pt."tagId" = $1 AND p."isActive" = true`,
        [tag.id],
      );
      total = Number(countRow[0]?.total || 0);
      products = await this.tagRepository.manager.query(
        `SELECT p.* FROM product p
         INNER JOIN product_tags pt ON pt."productId" = p.id
         WHERE pt."tagId" = $1 AND p."isActive" = true
         ORDER BY p."sortOrder" ASC, p."createdAt" DESC
         LIMIT $2 OFFSET $3`,
        [tag.id, limit, skip],
      );
    } catch {
      // Table might not exist yet
    }

    return { tag, products, total, page, limit };
  }

  async findById(id: number): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) throw new NotFoundException(`Tag #${id} not found`);
    return tag;
  }

  async findOrCreate(name: string): Promise<Tag> {
    const slug = slugify(name);
    let tag = await this.tagRepository.findOne({ where: { slug } });
    if (!tag) {
      tag = this.tagRepository.create({ name, slug });
      tag = await this.tagRepository.save(tag);
    }
    return tag;
  }

  async create(dto: CreateTagDto): Promise<Tag> {
    const slug = dto.slug || slugify(dto.name);
    const existing = await this.tagRepository.findOne({ where: { slug } });
    if (existing) throw new BadRequestException(`Tag with slug "${slug}" already exists`);
    const tag = this.tagRepository.create({ name: dto.name, slug });
    return this.tagRepository.save(tag);
  }

  async update(id: number, dto: UpdateTagDto): Promise<Tag> {
    const tag = await this.findById(id);
    if (dto.name) {
      tag.name = dto.name;
      tag.slug = dto.slug || slugify(dto.name);
    }
    if (dto.slug) tag.slug = dto.slug;
    return this.tagRepository.save(tag);
  }

  async remove(id: number): Promise<void> {
    const tag = await this.findById(id);
    await this.tagRepository.remove(tag);
  }

  async merge(sourceId: number, targetId: number): Promise<Tag> {
    const source = await this.tagRepository.findOne({
      where: { id: sourceId },
      relations: ['products'],
    });
    const target = await this.tagRepository.findOne({
      where: { id: targetId },
      relations: ['products'],
    });
    if (!source || !target) throw new NotFoundException('Tag not found');

    const existingProductIds = new Set(target.products.map((p) => p.id));
    for (const product of source.products) {
      if (!existingProductIds.has(product.id)) {
        target.products.push(product);
      }
    }
    await this.tagRepository.save(target);
    await this.tagRepository.remove(source);
    return target;
  }
}
