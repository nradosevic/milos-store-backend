import { TestimonialsService } from './testimonials.service';
export declare class TestimonialsController {
    private readonly testimonialsService;
    constructor(testimonialsService: TestimonialsService);
    findAll(): Promise<import("./entities/testimonial.entity").Testimonial[]>;
}
