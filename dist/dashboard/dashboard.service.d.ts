import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { ContactSubmission } from '../contact/entities/contact-submission.entity';
import { Category } from '../categories/entities/category.entity';
import { Tag } from '../tags/entities/tag.entity';
export declare class DashboardService {
    private productRepository;
    private contactRepository;
    private categoryRepository;
    private tagRepository;
    constructor(productRepository: Repository<Product>, contactRepository: Repository<ContactSubmission>, categoryRepository: Repository<Category>, tagRepository: Repository<Tag>);
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
            recent: ContactSubmission[];
        };
        categories: {
            total: number;
        };
        tags: {
            total: number;
        };
    }>;
}
