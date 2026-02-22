import { SettingsService } from './settings.service';
export declare class AdminSettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    findAll(): Promise<import("./entities/site-settings.entity").SiteSettings[]>;
    upsert(body: {
        key: string;
        value: string;
        type?: string;
    }): Promise<import("./entities/site-settings.entity").SiteSettings>;
    update(id: number, body: {
        value: string;
        type?: string;
    }): Promise<import("./entities/site-settings.entity").SiteSettings>;
    remove(id: number): Promise<void>;
}
