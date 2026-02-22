import { IsString, IsOptional, IsBoolean, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateTestimonialDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsString()
  authorName?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
