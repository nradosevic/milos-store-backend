import { AuthService } from '../auth/auth.service';
import { CategoriesService } from '../categories/categories.service';
import { TestimonialsService } from '../testimonials/testimonials.service';
import { FaqService } from '../faq/faq.service';
import { SettingsService } from '../settings/settings.service';
export declare class SeedService {
    private authService;
    private categoriesService;
    private testimonialsService;
    private faqService;
    private settingsService;
    private readonly logger;
    constructor(authService: AuthService, categoriesService: CategoriesService, testimonialsService: TestimonialsService, faqService: FaqService, settingsService: SettingsService);
    seed(): Promise<void>;
    private seedAdmin;
    private seedCategories;
    private seedTestimonials;
    private seedFaq;
    private seedSettings;
}
