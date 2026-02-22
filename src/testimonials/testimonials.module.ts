import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Testimonial } from './entities/testimonial.entity';
import { TestimonialsService } from './testimonials.service';
import { TestimonialsController } from './testimonials.controller';
import { AdminTestimonialsController } from './admin-testimonials.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Testimonial])],
  controllers: [TestimonialsController, AdminTestimonialsController],
  providers: [TestimonialsService],
  exports: [TestimonialsService],
})
export class TestimonialsModule {}
