import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { AdminTagsController } from './admin-tags.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tag])],
  controllers: [TagsController, AdminTagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
