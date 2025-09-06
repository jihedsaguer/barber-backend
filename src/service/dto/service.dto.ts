import { IsString, IsNumber, IsOptional, IsBoolean, Min, MinLength } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @MinLength(1, { message: 'Name cannot be empty' })
  name: string;

  @IsNumber()
  @Min(1, { message: 'Duration must be at least 1 minute' })
  duration: number;

  @IsNumber()
  @Min(0, { message: 'Price must be non-negative' })
  price: number;
}

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Name cannot be empty' })
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Duration must be at least 1 minute' })
  duration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Price must be non-negative' })
  price?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
  