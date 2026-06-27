import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { KycModule } from '../kyc/kyc.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [KycModule, PaymentsModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
