import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class InitiatePaymentDto {
  @ApiProperty({ enum: [PaymentMethod.CIB, PaymentMethod.EDAHABIA] })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}

export class RecordCashPaymentDto {
  @ApiProperty() @IsNumber() @Min(0) amountDA: number;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}
