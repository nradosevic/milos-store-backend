import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe,
} from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';

@Controller('admin/testimonials')
export class AdminTestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Get()
  findAll() {
    return this.testimonialsService.findAllAdmin();
  }

  @Post()
  create(@Body() dto: CreateTestimonialDto) {
    return this.testimonialsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTestimonialDto) {
    return this.testimonialsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.testimonialsService.remove(id);
  }
}
