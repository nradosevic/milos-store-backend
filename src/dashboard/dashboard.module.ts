import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { ContactSubmission } from '../contact/entities/contact-submission.entity';
import { Category } from '../categories/entities/category.entity';
import { Tag } from '../tags/entities/tag.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ContactSubmission, Category, Tag])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
