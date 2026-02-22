import { Repository } from 'typeorm';
import { Testimonial } from './entities/testimonial.entity';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
export declare class TestimonialsService {
    private testimonialRepository;
    constructor(testimonialRepository: Repository<Testimonial>);
    findAll(): Promise<Testimonial[]>;
    findAllAdmin(): Promise<Testimonial[]>;
    findById(id: number): Promise<Testimonial>;
    create(dto: CreateTestimonialDto): Promise<Testimonial>;
    update(id: number, dto: UpdateTestimonialDto): Promise<Testimonial>;
    remove(id: number): Promise<void>;
}
