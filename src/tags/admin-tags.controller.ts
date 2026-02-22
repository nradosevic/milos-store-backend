import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { MergeTagsDto } from './dto/merge-tags.dto';

@Controller('admin/tags')
export class AdminTagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  findAll() {
    return this.tagsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateTagDto) {
    return this.tagsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTagDto) {
    return this.tagsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tagsService.remove(id);
  }

  @Post('merge')
  merge(@Body() dto: MergeTagsDto) {
    return this.tagsService.merge(dto.sourceId, dto.targetId);
  }
}
