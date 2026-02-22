import { Controller, Get, Param } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { Public } from '../common/decorators/public.decorator';

@Public()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get(':key')
  findByKey(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }
}
