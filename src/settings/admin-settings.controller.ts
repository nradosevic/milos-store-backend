import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, NotFoundException,
} from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @Post()
  upsert(@Body() body: { key: string; value: string; type?: string }) {
    return this.settingsService.upsert(body.key, body.value, body.type);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { value: string; type?: string },
  ) {
    const all = await this.settingsService.findAll();
    const setting = all.find((s) => s.id === id);
    if (!setting) throw new NotFoundException(`Setting #${id} not found`);
    return this.settingsService.upsert(setting.key, body.value, body.type || setting.type);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.settingsService.remove(id);
  }
}
