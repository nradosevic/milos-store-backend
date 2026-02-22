import { IsString, IsOptional, IsEmail, IsNotEmpty } from 'class-validator';

export class CreateContactDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  productSlug?: string;

  @IsOptional()
  @IsString()
  productTitle?: string;
}
