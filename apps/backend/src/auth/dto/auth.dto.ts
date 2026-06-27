import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  Matches,
  Length,
  IsOptional,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { normaliseAlgerianPhone } from '../../common/utils/phone.util';

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/request-otp
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Accepts phone in any common Algerian format and normalises to E.164.
 * Examples of accepted inputs:
 *   "0551234567", "05 51 23 45 67", "+213551234567", "00213551234567"
 */
export class RequestOtpDto {
  @ApiProperty({
    description: 'Algerian mobile phone number (any common format)',
    example: '0551234567',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => normaliseAlgerianPhone(value) ?? value)
  @Matches(/^\+213[5-7]\d{8}$/, {
    message:
      'Phone must be a valid Algerian mobile number ' +
      '(Mobilis 05xx, Djezzy 06xx, Ooredoo 07xx). ' +
      'Accepted formats: 0551234567, +213551234567, 00213551234567.',
  })
  phone: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/verify-otp
// ─────────────────────────────────────────────────────────────────────────────

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Algerian mobile phone number (same as used in request-otp)',
    example: '0551234567',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string }) => normaliseAlgerianPhone(value) ?? value)
  @Matches(/^\+213[5-7]\d{8}$/, {
    message: 'Invalid phone number format.',
  })
  phone: string;

  @ApiProperty({
    description: '6-digit OTP code received via SMS',
    example: '483920',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits.' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only digits.' })
  otp: string;

  @ApiProperty({
    description: 'First name — required only on first login (registration)',
    example: 'Mohamed',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @ApiProperty({
    description: 'Last name — required only on first login (registration)',
    example: 'Bensalem',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @ApiProperty({
    description: 'Preferred UI language',
    enum: ['fr', 'ar'],
    default: 'fr',
    required: false,
  })
  @IsOptional()
  @IsIn(['fr', 'ar'])
  locale?: 'fr' | 'ar';
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/refresh
// ─────────────────────────────────────────────────────────────────────────────

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Long-lived refresh token received from verify-otp',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
