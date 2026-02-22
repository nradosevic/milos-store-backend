import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getStats(): Promise<{
        products: {
            total: number;
            active: number;
            sold: number;
            featured: number;
        };
        contacts: {
            total: number;
            unread: number;
            recent: import("../contact/entities/contact-submission.entity").ContactSubmission[];
        };
        categories: {
            total: number;
        };
        tags: {
            total: number;
        };
    }>;
}
