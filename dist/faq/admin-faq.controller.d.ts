import { FaqService } from './faq.service';
import { CreateFaqItemDto } from './dto/create-faq-item.dto';
import { UpdateFaqItemDto } from './dto/update-faq-item.dto';
export declare class AdminFaqController {
    private readonly faqService;
    constructor(faqService: FaqService);
    findAll(): Promise<import("./entities/faq-item.entity").FaqItem[]>;
    create(dto: CreateFaqItemDto): Promise<import("./entities/faq-item.entity").FaqItem>;
    update(id: number, dto: UpdateFaqItemDto): Promise<import("./entities/faq-item.entity").FaqItem>;
    remove(id: number): Promise<void>;
}
