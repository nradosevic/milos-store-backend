import { Repository } from 'typeorm';
import { FaqItem } from './entities/faq-item.entity';
import { CreateFaqItemDto } from './dto/create-faq-item.dto';
import { UpdateFaqItemDto } from './dto/update-faq-item.dto';
export declare class FaqService {
    private faqRepository;
    constructor(faqRepository: Repository<FaqItem>);
    findAll(): Promise<FaqItem[]>;
    findAllAdmin(): Promise<FaqItem[]>;
    findById(id: number): Promise<FaqItem>;
    create(dto: CreateFaqItemDto): Promise<FaqItem>;
    update(id: number, dto: UpdateFaqItemDto): Promise<FaqItem>;
    remove(id: number): Promise<void>;
}
