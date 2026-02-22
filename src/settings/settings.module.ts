import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SiteSettings } from './entities/site-settings.entity';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { AdminSettingsController } from './admin-settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SiteSettings])],
  controllers: [SettingsController, AdminSettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
