import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SettingsModule } from '../settings/settings.module';
import { SellerStatsService } from './seller-stats.service';
import { SellerStatsController } from './seller-stats.controller';
import { SellerStatsCron } from './seller-stats.cron';

@Module({
  imports: [SettingsModule, ScheduleModule.forRoot()],
  providers: [SellerStatsService, SellerStatsCron],
  controllers: [SellerStatsController],
  exports: [SellerStatsService],
})
export class SellerStatsModule {}
