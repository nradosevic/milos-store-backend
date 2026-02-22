import {
  IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsNotEmpty,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsBoolean()
  priceOnRequest?: boolean;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsString()
  origin?: string;

  @IsOptional()
  @IsString()
  dimensions?: string;

  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsString()
  period?: string;

  @IsOptional()
  @IsArray()
  hiddenFields?: string[];

  @IsOptional()
  customFields?: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  isUnique?: boolean;

  @IsOptional()
  @IsNumber()
  stock?: number;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isSold?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsArray()
  tags?: string[];
}
