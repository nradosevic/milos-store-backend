import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { AuthModule } from '../auth/auth.module';
import { CategoriesModule } from '../categories/categories.module';
import { TestimonialsModule } from '../testimonials/testimonials.module';
import { FaqModule } from '../faq/faq.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [AuthModule, CategoriesModule, TestimonialsModule, FaqModule, SettingsModule],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
