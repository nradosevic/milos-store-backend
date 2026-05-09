import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Product } from '../products/entities/product.entity';
import { SiteSettings } from '../settings/entities/site-settings.entity';
import { IndexingApiService } from './indexing-api.service';
import { IndexingApiController } from './indexing-api.controller';
import { IndexingApiCron } from './indexing-api.cron';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, SiteSettings]),
    ScheduleModule.forRoot(),
  ],
  providers: [IndexingApiService, IndexingApiCron],
  controllers: [IndexingApiController],
  exports: [IndexingApiService],
})
export class IndexingApiModule {}
