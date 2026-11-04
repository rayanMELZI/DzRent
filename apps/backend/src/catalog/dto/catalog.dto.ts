import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Agency-first search (design handoff §3.1): wilaya + period → agencies. */
export class SearchAgenciesDto {
  @ApiProperty({ example: 16 }) @Type(() => Number) @IsInt() @Min(1) @Max(58) wilayaId: number;
  @ApiProperty() @IsISO8601() from: string;
  @ApiProperty() @IsISO8601() until: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50) categorySlug?: string;
  /** "Make Model" as returned in `models` — filters agencies offering that model. */
  @ApiPropertyOptional({ example: 'Dacia Logan' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  model?: string;
}

/** Optional period for the agency page: restricts cars to those free in it. */
export class AgencyCarsQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsISO8601() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() until?: string;
}

export class QuoteDto {
  @ApiProperty() @IsUUID() vehicleId: string;
  @ApiProperty() @IsISO8601() from: string;
  @ApiProperty() @IsISO8601() until: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(5) additionalDrivers?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasChildSeat?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() hasGpsScreen?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() withInsuranceWaiver?: boolean;
}
