import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe,
  Query, UseInterceptors, UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProductsService } from './products.service';
import { UploadService } from '../upload/upload.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';

@Controller('admin/products')
export class AdminProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly uploadService: UploadService,
  ) {}

  @Get()
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }

  @Patch(':id/mark-sold')
  markSold(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.markSold(id);
  }

  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('files', 20, { storage: memoryStorage() }))
  async uploadImages(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const images: any[] = [];
    for (const file of files) {
      const { s3Key, thumbnailS3Key } = await this.uploadService.uploadProductImage(id, file);
      const image = await this.productsService.addImage(id, {
        s3Key,
        thumbnailS3Key,
        originalName: file.originalname,
        isMain: false,
        sortOrder: 0,
      });
      images.push(image);
    }
    return images;
  }

  @Patch(':id/images/:imageId')
  updateImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @Body() data: { isMain?: boolean; sortOrder?: number; altText?: string },
  ) {
    return this.productsService.updateImage(id, imageId, data);
  }

  @Delete(':id/images/:imageId')
  async deleteImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    const image = await this.productsService.findImage(id, imageId);
    if (image.s3Key) await this.uploadService.deleteFile(image.s3Key);
    if (image.thumbnailS3Key) await this.uploadService.deleteFile(image.thumbnailS3Key);
    return this.productsService.removeImage(id, imageId);
  }
}
