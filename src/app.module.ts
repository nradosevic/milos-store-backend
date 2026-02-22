import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module';
import { ProductsModule } from './products/products.module';
import { UploadModule } from './upload/upload.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { FaqModule } from './faq/faq.module';
import { ContactModule } from './contact/contact.module';
import { SettingsModule } from './settings/settings.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SitemapModule } from './sitemap/sitemap.module';
import { SeedModule } from './seed/seed.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuthModule,
    CategoriesModule,
    TagsModule,
    ProductsModule,
    UploadModule,
    TestimonialsModule,
    FaqModule,
    ContactModule,
    SettingsModule,
    DashboardModule,
    SitemapModule,
    SeedModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
