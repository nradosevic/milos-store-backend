import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
export declare class AdminTestimonialsController {
    private readonly testimonialsService;
    constructor(testimonialsService: TestimonialsService);
    findAll(): Promise<import("./entities/testimonial.entity").Testimonial[]>;
    create(dto: CreateTestimonialDto): Promise<import("./entities/testimonial.entity").Testimonial>;
    update(id: number, dto: UpdateTestimonialDto): Promise<import("./entities/testimonial.entity").Testimonial>;
    remove(id: number): Promise<void>;
}
