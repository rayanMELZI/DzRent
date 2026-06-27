import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsISO8601, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { KycDocumentType } from '@prisma/client';

export const KYC_ALLOWED_MIME = ['image/jpeg', 'image/png', 'application/pdf'] as const;
export const KYC_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export class KycUploadIntentDto {
  @ApiProperty({ enum: KycDocumentType })
  @IsEnum(KycDocumentType)
  documentType: KycDocumentType;

  @ApiProperty({ enum: KYC_ALLOWED_MIME })
  @IsIn(KYC_ALLOWED_MIME as unknown as string[])
  mimeType: string;
}

export class SubmitKycDocumentDto {
  @ApiProperty({ enum: KycDocumentType })
  @IsEnum(KycDocumentType)
  documentType: KycDocumentType;

  @ApiProperty({ description: 'fileKey returned by /kyc/upload-intent' })
  @IsString() @MaxLength(500)
  fileKey: string;

  @ApiPropertyOptional({ description: 'CIN number (18 digits) / permis number' })
  @IsOptional() @IsString() @Length(1, 100)
  documentNumber?: string;

  @ApiPropertyOptional({ description: 'ISO date — date de délivrance' })
  @IsOptional() @IsISO8601()
  issuedAt?: string;

  @ApiPropertyOptional({ description: 'ISO date — expiry (CIN valid 10 yrs in DZ)' })
  @IsOptional() @IsISO8601()
  expiresAt?: string;

  @ApiPropertyOptional({ example: 'Alger' })
  @IsOptional() @IsString() @MaxLength(100)
  issuingWilaya?: string;
}

export class RejectKycDto {
  @ApiProperty({ example: 'Photo illisible — merci de soumettre un scan net.' })
  @IsString() @Length(5, 2000)
  rejectionReason: string;
}
