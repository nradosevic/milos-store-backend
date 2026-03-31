import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe,
  Query, UseInterceptors, UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SkipThrottle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { ProductsService } from './products.service';
import { UploadService } from '../upload/upload.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';

@SkipThrottle()
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

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findById(id);
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
    // Sort files by original filename so numbered files (1.jpg, 2.jpg, ...) keep order
    const sorted = [...files].sort((a, b) =>
      a.originalname.localeCompare(b.originalname, undefined, { numeric: true }),
    );

    const existingImages = await this.productsService.getImageCount(id);
    const hasMain = await this.productsService.hasMainImage(id);

    const images: any[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const file = sorted[i];
      const { s3Key, thumbnailS3Key } = await this.uploadService.uploadProductImage(id, file);
      const image = await this.productsService.addImage(id, {
        s3Key,
        thumbnailS3Key,
        originalName: file.originalname,
        isMain: !hasMain && i === 0,
        sortOrder: existingImages + i,
      });
      images.push(image);
    }
    return images;
  }

  @Patch(':id/images/reorder')
  reorderImages(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { imageIds: number[] },
  ) {
    return this.productsService.reorderImages(id, body.imageIds);
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
