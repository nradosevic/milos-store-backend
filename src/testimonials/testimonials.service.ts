import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Testimonial } from './entities/testimonial.entity';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectRepository(Testimonial)
    private testimonialRepository: Repository<Testimonial>,
  ) {}

  findAll(): Promise<Testimonial[]> {
    return this.testimonialRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  findAllAdmin(): Promise<Testimonial[]> {
    return this.testimonialRepository.find({ order: { sortOrder: 'ASC' } });
  }

  async findById(id: number): Promise<Testimonial> {
    const t = await this.testimonialRepository.findOne({ where: { id } });
    if (!t) throw new NotFoundException(`Testimonial #${id} not found`);
    return t;
  }

  create(dto: CreateTestimonialDto): Promise<Testimonial> {
    return this.testimonialRepository.save(this.testimonialRepository.create(dto));
  }

  async update(id: number, dto: UpdateTestimonialDto): Promise<Testimonial> {
    const t = await this.findById(id);
    Object.assign(t, dto);
    return this.testimonialRepository.save(t);
  }

  async remove(id: number): Promise<void> {
    const t = await this.findById(id);
    await this.testimonialRepository.remove(t);
  }
}
