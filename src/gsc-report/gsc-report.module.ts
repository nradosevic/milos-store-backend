import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Product } from '../products/entities/product.entity';
import { IndexingApiModule } from '../indexing-api/indexing-api.module';
import { GscReportService } from './gsc-report.service';
import { GscReportCron } from './gsc-report.cron';
import { GscReportController } from './gsc-report.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    ScheduleModule.forRoot(),
    IndexingApiModule,
  ],
  providers: [GscReportService, GscReportCron],
  controllers: [GscReportController],
})
export class GscReportModule {}
