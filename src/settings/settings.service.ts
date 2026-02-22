import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteSettings } from './entities/site-settings.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SiteSettings)
    private settingsRepository: Repository<SiteSettings>,
  ) {}

  async findByKey(key: string): Promise<SiteSettings> {
    const s = await this.settingsRepository.findOne({ where: { key } });
    if (!s) throw new NotFoundException(`Setting "${key}" not found`);
    return s;
  }

  findAll(): Promise<SiteSettings[]> {
    return this.settingsRepository.find({ order: { key: 'ASC' } });
  }

  async upsert(key: string, value: string, type: string = 'text'): Promise<SiteSettings> {
    let setting = await this.settingsRepository.findOne({ where: { key } });
    if (setting) {
      setting.value = value;
      setting.type = type;
    } else {
      setting = this.settingsRepository.create({ key, value, type });
    }
    return this.settingsRepository.save(setting);
  }

  async remove(id: number): Promise<void> {
    const s = await this.settingsRepository.findOne({ where: { id } });
    if (!s) throw new NotFoundException(`Setting #${id} not found`);
    await this.settingsRepository.remove(s);
  }
}
