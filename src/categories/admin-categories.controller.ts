import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Query,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { BulkImportCategoriesDto } from './dto/bulk-import-category.dto';

@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }

  @Post('bulk-import')
  bulkImport(
    @Body() dto: BulkImportCategoriesDto,
    @Query('mode') mode: string = 'merge',
  ) {
    return this.categoriesService.bulkImport(dto.categories, mode);
  }

  @Get('bulk-export')
  bulkExport() {
    return this.categoriesService.exportTree();
  }
}
