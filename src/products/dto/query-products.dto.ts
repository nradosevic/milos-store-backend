import { IsOptional, IsString, IsNumber, IsBoolean, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QueryProductsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  yearMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  yearMax?: number;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMax?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isUnique?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isSold?: boolean;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortDir?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
