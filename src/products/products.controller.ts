import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { QueryProductsDto } from './dto/query-products.dto';
import { Public } from '../common/decorators/public.decorator';

@Public()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get('autocomplete')
  autocomplete(@Query('q') q: string) {
    return this.productsService.autocomplete(q);
  }

  @Get('popular')
  findPopular(@Query('limit') limit: number = 10) {
    return this.productsService.findPopular(Number(limit));
  }

  @Get('featured')
  findFeatured() {
    return this.productsService.findFeatured();
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }
}
