import { Repository } from 'typeorm';
import { ContactSubmission } from './entities/contact-submission.entity';
import { CreateContactDto } from './dto/create-contact.dto';
export declare class ContactService {
    private contactRepository;
    constructor(contactRepository: Repository<ContactSubmission>);
    create(dto: CreateContactDto): Promise<ContactSubmission>;
    findAll(page?: number, limit?: number, isRead?: boolean): Promise<[ContactSubmission[], number]>;
    findById(id: number): Promise<ContactSubmission>;
    update(id: number, data: Partial<ContactSubmission>): Promise<ContactSubmission>;
}
