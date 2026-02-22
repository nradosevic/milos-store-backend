import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkImportCategoryItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  iconName?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkImportCategoryItemDto)
  children?: BulkImportCategoryItemDto[];
}

export class BulkImportCategoriesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkImportCategoryItemDto)
  categories: BulkImportCategoryItemDto[];
}
