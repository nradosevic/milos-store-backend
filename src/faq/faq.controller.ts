import { Controller, Get } from '@nestjs/common';
import { FaqService } from './faq.service';
import { Public } from '../common/decorators/public.decorator';

@Public()
@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Get()
  findAll() {
    return this.faqService.findAll();
  }
}
