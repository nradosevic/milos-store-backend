import { SettingsService } from './settings.service';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    findByKey(key: string): Promise<import("./entities/site-settings.entity").SiteSettings>;
}
