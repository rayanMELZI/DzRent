import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { StaffRole } from '@prisma/client';
import { normaliseAlgerianPhone } from '../../common/utils/phone.util';

export class CreateAgencyDto {
  @ApiProperty({ example: 'Atlas Location Auto' })
  @IsString()
  @Length(3, 200)
  name: string;

  @ApiPropertyOptional({ example: 'أطلس لتأجير السيارات' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameAr?: string;

  @ApiProperty({ description: 'Official wilaya code 1–58', example: 16 })
  @IsInt()
  @Min(1)
  @Max(58)
  wilayaId: number;

  @ApiProperty({ example: '0551234567' })
  @IsString()
  @Transform(({ value }: { value: string }) => normaliseAlgerianPhone(value) ?? value)
  @Matches(/^\+213\d{8,9}$/, { message: 'Phone must be a valid Algerian number.' })
  phone: string;

  @ApiProperty({ example: '12 Rue Didouche Mourad' })
  @IsString()
  @Length(5, 500)
  address: string;

  @ApiProperty({ example: 'Alger Centre' })
  @IsString()
  @Length(2, 150)
  commune: string;

  @ApiPropertyOptional({ description: 'Registre de commerce (CNRC)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  registrationNo?: string;

  @ApiPropertyOptional({ description: "NIF — Numéro d'Identification Fiscale" })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  taxId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class UpdateAgencyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(3, 200)
  name?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameAr?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descriptionAr?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(5, 500)
  address?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sharesBlacklist?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  acceptsBlacklist?: boolean;
}

export class AgencyUploadIntentDto {
  @ApiProperty({ enum: ['RC', 'NIF', 'local_permit', 'bank_details', 'insurance_broker_cert'] })
  @IsIn(['RC', 'NIF', 'local_permit', 'bank_details', 'insurance_broker_cert'])
  documentType: string;

  @ApiProperty({ enum: ['image/jpeg', 'image/png', 'application/pdf'] })
  @IsIn(['image/jpeg', 'image/png', 'application/pdf'])
  mimeType: string;
}

export class SubmitAgencyDocumentDto {
  @ApiProperty({ enum: ['RC', 'NIF', 'local_permit', 'bank_details', 'insurance_broker_cert'] })
  @IsIn(['RC', 'NIF', 'local_permit', 'bank_details', 'insurance_broker_cert'])
  documentType: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  fileKey: string;
}

export class AddStaffDto {
  @ApiProperty({ example: '0661234567' })
  @IsString()
  @Transform(({ value }: { value: string }) => normaliseAlgerianPhone(value) ?? value)
  @Matches(/^\+213[5-7]\d{8}$/, { message: 'Staff phone must be a valid Algerian mobile.' })
  phone: string;

  @ApiProperty()
  @IsString()
  @Length(1, 100)
  firstName: string;

  @ApiProperty()
  @IsString()
  @Length(1, 100)
  lastName: string;

  @ApiProperty({ enum: StaffRole, default: StaffRole.AGENT })
  @IsEnum(StaffRole)
  staffRole: StaffRole;
}

export class VerifyAgencyDto {
  @ApiProperty()
  @IsBoolean()
  approved: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
