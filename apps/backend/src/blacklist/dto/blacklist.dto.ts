import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsISO8601, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { BlacklistReason } from '@prisma/client';
import { normaliseAlgerianPhone } from '../../common/utils/phone.util';

export class CreateBlacklistDto {
  @ApiPropertyOptional({ description: 'Target user UUID (or use phone)' })
  @IsOptional() @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Target phone — resolved to an existing user' })
  @IsOptional() @IsString()
  @Transform(({ value }: { value: string }) => (value ? normaliseAlgerianPhone(value) ?? value : value))
  @Matches(/^\+213\d{8,9}$/)
  phone?: string;

  @ApiProperty({ enum: BlacklistReason }) @IsEnum(BlacklistReason)
  reason: BlacklistReason;

  @ApiProperty() @IsString() @Length(5, 2000)
  description: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID()
  bookingId?: string;

  @ApiPropertyOptional({ default: true, description: 'Share with all agencies (federation)' })
  @IsOptional() @IsBoolean()
  isShared?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsISO8601()
  expiresAt?: string;

  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @ArrayMaxSize(10)
  evidenceKeys?: string[];
}

export class AdminReviewBlacklistDto {
  @ApiProperty() @IsBoolean() isActive: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(0, 2000) adminNotes?: string;
}
