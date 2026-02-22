import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';

@Injectable()
export class SitemapService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async generateSitemap(baseUrl: string = 'https://rariteti.rs'): Promise<string> {
    const products = await this.productRepository.find({
      where: { isActive: true },
      select: ['slug', 'updatedAt'],
    });

    const categories = await this.categoryRepository.find({
      where: { isActive: true },
      select: ['slug', 'updatedAt'],
    });

    const urls: string[] = [
      `<url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
      `<url><loc>${baseUrl}/products</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
      `<url><loc>${baseUrl}/faq</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`,
      `<url><loc>${baseUrl}/contact</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`,
    ];

    for (const product of products) {
      urls.push(
        `<url><loc>${baseUrl}/products/${product.slug}</loc><lastmod>${product.updatedAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
      );
    }

    for (const category of categories) {
      urls.push(
        `<url><loc>${baseUrl}/categories/${category.slug}</loc><lastmod>${category.updatedAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
      );
    }

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
  }
}
