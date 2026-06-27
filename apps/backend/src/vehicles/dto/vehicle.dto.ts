import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsIn, IsISO8601, IsInt, IsNumber, IsOptional,
  IsString, Length, Matches, Max, MaxLength, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FuelType, InsuranceCoverageType, TransmissionType, VehicleDocumentType, VehicleStatus } from '@prisma/client';

/** Algerian plate: 6 digits, dash, wilaya code 01–58 (schema rule). */
export const PLATE_REGEX = /^\d{6}-(0[1-9]|[1-4]\d|5[0-8])$/;

export class CreateVehicleDto {
  @ApiProperty({ example: '123456-16' })
  @Matches(PLATE_REGEX, { message: 'licensePlate must match NNNNNN-WW (WW = wilaya 01–58).' })
  licensePlate: string;

  @ApiProperty() @IsString() @Length(5, 50)
  chassisNumber: string;

  @ApiProperty({ example: 'citadine', description: 'VehicleCategory slug' })
  @IsString() @Length(2, 50)
  categorySlug: string;

  @ApiProperty() @IsString() @Length(1, 100) make: string;
  @ApiProperty() @IsString() @Length(1, 100) model: string;
  @ApiProperty() @IsInt() @Min(1990) @Max(2030) year: number;
  @ApiProperty() @IsString() @Length(2, 50) color: string;
  @ApiProperty({ enum: FuelType }) @IsEnum(FuelType) fuelType: FuelType;
  @ApiProperty({ enum: TransmissionType }) @IsEnum(TransmissionType) transmission: TransmissionType;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(2) @Max(9) seats?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(2) @Max(6) doors?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) currentMileageKm?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) dailyRateDA?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) weeklyRateDA?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) monthlyRateDA?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) depositAmountDA?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) gpsDeviceId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) gpsImei?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(20) features?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(2, 50) color?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) currentMileageKm?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) dailyRateDA?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) weeklyRateDA?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) monthlyRateDA?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) depositAmountDA?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) gpsDeviceId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) gpsImei?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(20) features?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() availableFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() availableUntil?: string;
}

export class SetVehicleStatusDto {
  @ApiProperty({ enum: VehicleStatus }) @IsEnum(VehicleStatus) status: VehicleStatus;
}

export class VehiclePhotoIntentDto {
  @ApiProperty({ enum: ['image/jpeg', 'image/png'] }) @IsIn(['image/jpeg', 'image/png']) mimeType: string;
}
export class AddVehiclePhotoDto {
  @ApiProperty() @IsString() @MaxLength(500) fileKey: string;
}

export class VehicleDocIntentDto {
  @ApiProperty({ enum: VehicleDocumentType }) @IsEnum(VehicleDocumentType) documentType: VehicleDocumentType;
  @ApiProperty({ enum: ['image/jpeg', 'image/png', 'application/pdf'] })
  @IsIn(['image/jpeg', 'image/png', 'application/pdf']) mimeType: string;
}
export class SubmitVehicleDocDto {
  @ApiProperty({ enum: VehicleDocumentType }) @IsEnum(VehicleDocumentType) documentType: VehicleDocumentType;
  @ApiProperty() @IsString() @MaxLength(500) fileKey: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) documentNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() issuedAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() expiresAt?: string;
}

export class AddInsuranceDto {
  @ApiProperty({ enum: InsuranceCoverageType }) @IsEnum(InsuranceCoverageType) coverageType: InsuranceCoverageType;
  @ApiProperty({ example: 'SAA' }) @IsString() @Length(2, 200) providerName: string;
  @ApiProperty() @IsString() @Length(2, 100) policyNumber: string;
  @ApiProperty() @IsNumber() @Min(0) coverageAmountDA: number;
  @ApiProperty() @IsNumber() @Min(0) premiumDA: number;
  @ApiProperty() @IsISO8601() startDate: string;
  @ApiProperty() @IsISO8601() endDate: string;
}

export class SearchVehiclesDto {
  @ApiProperty({ example: 16 }) @Type(() => Number) @IsInt() @Min(1) @Max(58) wilayaId: number;
  @ApiProperty() @IsISO8601() from: string;
  @ApiProperty() @IsISO8601() until: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categorySlug?: string;
  @ApiPropertyOptional({ enum: TransmissionType }) @IsOptional() @IsEnum(TransmissionType) transmission?: TransmissionType;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(2) seatsMin?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number = 20;
}
