import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsISO8601, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty() @IsUUID() vehicleId: string;
  @ApiProperty() @IsISO8601() requestedFrom: string;
  @ApiProperty() @IsISO8601() requestedUntil: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(58) pickupWilayaId?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) pickupAddress?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) returnAddress?: string;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0) @Max(5) additionalDrivers?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasChildSeat?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasGpsScreen?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() withInsuranceWaiver?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}

export class RejectBookingDto {
  @ApiProperty() @IsString() @MaxLength(1000) reason: string;
}

export class PickupDto {
  @ApiProperty() @IsInt() @Min(0) mileageAtPickupKm: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(100) fuelLevel?: number;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() photos?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class ReturnDto {
  @ApiProperty() @IsInt() @Min(0) mileageAtReturnKm: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(100) fuelLevel?: number;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() photos?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
