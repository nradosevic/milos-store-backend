import { ContactService } from './contact.service';
export declare class AdminContactController {
    private readonly contactService;
    constructor(contactService: ContactService);
    findAll(page?: number, limit?: number, isRead?: string): Promise<{
        data: import("./entities/contact-submission.entity").ContactSubmission[];
        total: number;
        page: number;
        limit: number;
    }>;
    update(id: number, body: {
        isRead?: boolean;
    }): Promise<import("./entities/contact-submission.entity").ContactSubmission>;
}
