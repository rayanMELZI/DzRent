import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PAYMENT_GATEWAY } from './gateways/payment-gateway.interface';
import { MockGateway } from './gateways/mock.gateway';
import { SatimGateway } from './gateways/satim.gateway';
import { ContractsModule } from '../contracts/contracts.module';

/**
 * Gateway selection mirrors the SMS pattern: real SATIM only in production with
 * credentials present; MockGateway everywhere else so the pipeline runs in dev.
 */
@Module({
  imports: [ContractsModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    MockGateway,
    SatimGateway,
    {
      provide: PAYMENT_GATEWAY,
      inject: [ConfigService, MockGateway, SatimGateway],
      useFactory: (config: ConfigService, mock: MockGateway, satim: SatimGateway) => {
        const isProd = config.get('NODE_ENV') === 'production';
        const hasCreds = !!config.get('SATIM_USERNAME') && !!config.get('SATIM_PASSWORD');
        return isProd && hasCreds ? satim : mock;
      },
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
