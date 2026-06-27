import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Length,
  IsIn,
  IsEmail,
  Matches,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Exclude, Expose } from 'class-transformer';

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PROFILE DTO
// ─────────────────────────────────────────────────────────────────────────────

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Mohamed' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Bensalem' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @ApiPropertyOptional({ example: 'mohamed@gmail.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address.' })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email?: string;

  @ApiPropertyOptional({ enum: ['fr', 'ar'] })
  @IsOptional()
  @IsIn(['fr', 'ar'])
  locale?: 'fr' | 'ar';

  @ApiPropertyOptional({ example: 'https://cdn.dzrent.dz/avatars/abc.jpg' })
  @IsOptional()
  @IsString()
  @Matches(/^https?:\/\/.+/, { message: 'avatarUrl must be a valid URL.' })
  avatarUrl?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// LIST USERS QUERY DTO (Admin)
// ─────────────────────────────────────────────────────────────────────────────

export class ListUsersQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ['CLIENT', 'AGENCY_OWNER', 'AGENCY_STAFF', 'ADMIN'] })
  @IsOptional()
  @IsIn(['CLIENT', 'AGENCY_OWNER', 'AGENCY_STAFF', 'ADMIN'])
  role?: string;

  @ApiPropertyOptional({ enum: ['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'BANNED'] })
  @IsOptional()
  @IsIn(['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'BANNED'])
  status?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// KYC DOCUMENT SUMMARY (embedded in user response)
// ─────────────────────────────────────────────────────────────────────────────

@Exclude()
export class KycDocumentSummaryDto {
  @Expose()
  @ApiProperty({ enum: ['CIN', 'DRIVING_LICENSE', 'SELFIE', 'PROOF_OF_ADDRESS', 'PASSPORT'] })
  documentType: string;

  @Expose()
  @ApiProperty({ enum: ['NOT_SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED'] })
  status: string;

  @Expose()
  @ApiPropertyOptional()
  expiresAt?: Date | null;

  @Expose()
  @ApiProperty()
  version: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// USER RESPONSE DTO (safe — no sensitive fields)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safe user response for the authenticated user's own profile.
 *
 * Uses @Exclude() at class level + @Expose() per field to guarantee
 * that any new field added to the Prisma User model is NOT accidentally
 * included in API responses. Developers must explicitly @Expose() new fields.
 *
 * Sensitive fields intentionally excluded:
 *   otpHash, otpExpiresAt, otpAttempts, riskScore, riskFlags,
 *   nationalIdNumber, lastLoginIp
 */
@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty({ example: 'b3f1c2d4-ab56-7890-cdef-123456789012' })
  id: string;

  @Expose()
  @ApiProperty({ example: '+213551234567' })
  phone: string;

  @Expose()
  @ApiPropertyOptional({ example: 'mohamed@gmail.com' })
  email: string | null;

  @Expose()
  @ApiProperty({ example: 'Mohamed' })
  firstName: string;

  @Expose()
  @ApiProperty({ example: 'Bensalem' })
  lastName: string;

  @Expose()
  @ApiProperty({ enum: ['CLIENT', 'AGENCY_OWNER', 'AGENCY_STAFF', 'ADMIN'] })
  role: string;

  @Expose()
  @ApiProperty({ enum: ['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'BANNED'] })
  status: string;

  @Expose()
  @ApiProperty({ enum: ['fr', 'ar'] })
  locale: string;

  @Expose()
  @ApiPropertyOptional({ example: 'https://cdn.dzrent.dz/avatars/abc.jpg' })
  avatarUrl: string | null;

  /**
   * KYC document summary — latest version per document type only.
   * Helps the client UI show which documents are approved/pending/missing.
   * Full document details are in the KYC module (Sprint 2.2).
   */
  @Expose()
  @ApiPropertyOptional({ type: [KycDocumentSummaryDto] })
  kycDocuments?: KycDocumentSummaryDto[];

  @Expose()
  @ApiProperty({ example: '2024-01-15T09:30:00.000Z' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN USER RESPONSE DTO — extends UserResponseDto with sensitive fields
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extended response for ADMIN endpoints only.
 * Adds fraud risk fields, login metadata, and agency relationships.
 *
 * Never use this DTO in non-admin endpoints — it leaks sensitive data.
 */
@Exclude()
export class AdminUserResponseDto extends UserResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Masked CIN number for identity verification',
    example: '123456789012345678',
  })
  nationalIdNumber: string | null;

  @Expose()
  @ApiProperty({ description: 'Fraud risk score 0–100', example: 12 })
  riskScore: number;

  @Expose()
  @ApiProperty({ description: 'Active risk flag codes', type: [String] })
  riskFlags: string[];

  @Expose()
  @ApiPropertyOptional()
  lastLoginAt: Date | null;

  @Expose()
  @ApiPropertyOptional({ example: '105.92.12.34' })
  lastLoginIp: string | null;

  @Expose()
  @ApiProperty()
  otpAttempts: number;

  @Expose()
  @ApiPropertyOptional()
  deletedAt: Date | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'AgencyStaff record if user is AGENCY_STAFF',
  })
  agencyStaff: {
    agencyId: string;
    staffRole: string;
    isActive: boolean;
    hiredAt: Date;
  } | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Agencies owned by this user (AGENCY_OWNER only)',
  })
  ownedAgencies: {
    id: string;
    name: string;
    wilayaId: number;
    isVerified: boolean;
    isActive: boolean;
  }[];
}
