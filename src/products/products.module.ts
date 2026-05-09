import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { AdminProductsController } from './admin-products.controller';
import { TagsModule } from '../tags/tags.module';
import { CategoriesModule } from '../categories/categories.module';
import { UploadModule } from '../upload/upload.module';
import { IndexingApiModule } from '../indexing-api/indexing-api.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage]),
    TagsModule,
    CategoriesModule,
    UploadModule,
    IndexingApiModule,
  ],
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
