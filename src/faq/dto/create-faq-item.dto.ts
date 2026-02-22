import { IsString, IsOptional, IsBoolean, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateFaqItemDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  answer: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
