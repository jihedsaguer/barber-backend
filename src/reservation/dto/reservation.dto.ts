import { IsString, IsNotEmpty, IsOptional, IsArray, IsMongoId, IsDateString } from 'class-validator';

export class CreateReservationDto {
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  // ✅ CLEAN: Only need service IDs - service details fetched from DB
  @IsOptional()
  @IsMongoId()
  serviceId?: string; // For single service (backward compatibility)

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  serviceIds?: string[]; // For multiple services

  @IsString()
  @IsNotEmpty()
  barberName: string;

  @IsDateString()
  date: string;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // ✅ REMOVED: No need to pass service names, prices, durations, or status
  // These are automatically handled by the backend
}

export class UpdateReservationDto {
  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  serviceIds?: string[];

  @IsOptional()
  @IsString()
  barberName?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';

  @IsOptional()
  @IsString()
  notes?: string;
}