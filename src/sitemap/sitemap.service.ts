import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
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
    private readonly config: ConfigService,
  ) {}

  private xmlEscape(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private imageUrl(key: string): string {
    const base = (this.config.get<string>('S3_PUBLIC_URL') ?? '').replace(/\/$/, '');
    if (!base) return '';
    return `${base}/${key.replace(/^\//, '')}`;
  }

  async generateSitemap(baseUrl: string = 'https://rariteti.rs'): Promise<string> {
    const products = await this.productRepository.find({
      where: { isActive: true },
      relations: { images: true },
    });

    const categories = await this.categoryRepository.find({
      where: { isActive: true },
      select: ['slug', 'updatedAt'],
    });

    const today = new Date().toISOString().split('T')[0];
    const urls: string[] = [
      `<url><loc>${baseUrl}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`,
      `<url><loc>${baseUrl}/prodavnica</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>`,
      `<url><loc>${baseUrl}/kontakt</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`,
    ];

    for (const product of products) {
      const lastmod = product.updatedAt.toISOString().split('T')[0];

      // Google image sitemap: up to 1000 images per page, but capping at 10
      // keeps the XML payload bounded for stores with photo-heavy products.
      const imageBlocks: string[] = [];
      const sortedImages = (product.images ?? [])
        .filter((img) => Boolean(img?.s3Key))
        .sort((a, b) => {
          if (a.isMain && !b.isMain) return -1;
          if (!a.isMain && b.isMain) return 1;
          return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        })
        .slice(0, 10);

      for (const img of sortedImages) {
        const loc = this.imageUrl(img.s3Key);
        if (!loc) break;
        const titleTag = product.title
          ? `<image:title>${this.xmlEscape(product.title)}</image:title>`
          : '';
        const captionTag = img.altText
          ? `<image:caption>${this.xmlEscape(img.altText)}</image:caption>`
          : '';
        imageBlocks.push(
          `<image:image><image:loc>${this.xmlEscape(loc)}</image:loc>${titleTag}${captionTag}</image:image>`,
        );
      }

      urls.push(
        `<url><loc>${baseUrl}/predmet/${product.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority>${imageBlocks.join('')}</url>`,
      );
    }

    for (const category of categories) {
      const lastmod = category.updatedAt.toISOString().split('T')[0];
      urls.push(
        `<url><loc>${baseUrl}/prodavnica?kategorija=${category.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
      );
    }

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>`;
  }
}
