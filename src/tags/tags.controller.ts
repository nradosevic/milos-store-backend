import { Controller, Get, Param, Query } from '@nestjs/common';
import { TagsService } from './tags.service';
import { Public } from '../common/decorators/public.decorator';

@Public()
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  findAll() {
    return this.tagsService.findAll();
  }

  @Get(':slug')
  findBySlug(
    @Param('slug') slug: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.tagsService.findBySlugWithProducts(slug, Number(page), Number(limit));
  }
}
