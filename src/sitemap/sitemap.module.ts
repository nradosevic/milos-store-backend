import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { SitemapService } from './sitemap.service';
import { SitemapController } from './sitemap.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category])],
  controllers: [SitemapController],
  providers: [SitemapService],
})
export class SitemapModule {}
