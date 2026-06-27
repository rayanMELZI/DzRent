import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsISO8601, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class GpsPingDto {
  @ApiProperty() @IsString() deviceId: string;
  @ApiProperty() @IsNumber() @Min(-90) @Max(90) latitude: number;
  @ApiProperty() @IsNumber() @Min(-180) @Max(180) longitude: number;
  @ApiProperty() @IsOptional() @IsNumber() speedKmh?: number;
  @ApiProperty() @IsOptional() @IsNumber() headingDeg?: number;
  @ApiProperty() @IsOptional() @IsBoolean() ignitionOn?: boolean;
  @ApiProperty() @IsISO8601() recordedAt: string;
}

export class GpsBatchDto {
  @ApiProperty({ type: [GpsPingDto] })
  @IsArray() @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => GpsPingDto)
  pings: GpsPingDto[];
}
