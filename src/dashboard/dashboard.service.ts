import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { ContactSubmission } from '../contact/entities/contact-submission.entity';
import { Category } from '../categories/entities/category.entity';
import { Tag } from '../tags/entities/tag.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ContactSubmission)
    private contactRepository: Repository<ContactSubmission>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
  ) {}

  async getStats() {
    const [totalProducts, activeProducts, soldProducts, featuredProducts] = await Promise.all([
      this.productRepository.count(),
      this.productRepository.count({ where: { isActive: true } }),
      this.productRepository.count({ where: { isSold: true } }),
      this.productRepository.count({ where: { isFeatured: true } }),
    ]);

    const [totalContacts, unreadContacts] = await Promise.all([
      this.contactRepository.count(),
      this.contactRepository.count({ where: { isRead: false } }),
    ]);

    const [totalCategories, totalTags] = await Promise.all([
      this.categoryRepository.count(),
      this.tagRepository.count(),
    ]);

    const recentContacts = await this.contactRepository.find({
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      products: { total: totalProducts, active: activeProducts, sold: soldProducts, featured: featuredProducts },
      contacts: { total: totalContacts, unread: unreadContacts, recent: recentContacts },
      categories: { total: totalCategories },
      tags: { total: totalTags },
    };
  }
}
