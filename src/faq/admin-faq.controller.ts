import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe,
} from '@nestjs/common';
import { FaqService } from './faq.service';
import { CreateFaqItemDto } from './dto/create-faq-item.dto';
import { UpdateFaqItemDto } from './dto/update-faq-item.dto';

@Controller('admin/faq')
export class AdminFaqController {
  constructor(private readonly faqService: FaqService) {}

  @Get()
  findAll() {
    return this.faqService.findAllAdmin();
  }

  @Post()
  create(@Body() dto: CreateFaqItemDto) {
    return this.faqService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFaqItemDto) {
    return this.faqService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.faqService.remove(id);
  }
}
