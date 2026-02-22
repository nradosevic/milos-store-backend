import { Repository } from 'typeorm';
import { SiteSettings } from './entities/site-settings.entity';
export declare class SettingsService {
    private settingsRepository;
    constructor(settingsRepository: Repository<SiteSettings>);
    findByKey(key: string): Promise<SiteSettings>;
    findAll(): Promise<SiteSettings[]>;
    upsert(key: string, value: string, type?: string): Promise<SiteSettings>;
    remove(id: number): Promise<void>;
}
