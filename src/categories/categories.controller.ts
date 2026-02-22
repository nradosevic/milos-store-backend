import { Controller, Get, Param, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Public } from '../common/decorators/public.decorator';

@Public()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findTree() {
    return this.categoriesService.findTree();
  }

  @Get(':slug')
  findBySlug(
    @Param('slug') slug: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.categoriesService.findBySlugWithProducts(slug, Number(page), Number(limit));
  }
}
