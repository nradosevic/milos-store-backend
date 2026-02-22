import { FaqService } from './faq.service';
export declare class FaqController {
    private readonly faqService;
    constructor(faqService: FaqService);
    findAll(): Promise<import("./entities/faq-item.entity").FaqItem[]>;
}
