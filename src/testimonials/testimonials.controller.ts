import { Controller, Get } from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';
import { Public } from '../common/decorators/public.decorator';

@Public()
@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Get()
  findAll() {
    return this.testimonialsService.findAll();
  }
}
