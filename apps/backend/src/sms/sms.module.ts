import { Global, Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { SMS_SERVICE } from './sms.interface';
import { TwilioSmsService } from './twilio-sms.service';
import { ConsoleSmsService } from './console-sms.service';

/**
 * SmsModule — provides ISmsService under the SMS_SERVICE injection token.
 *
 * ── @Global() — WHY ──────────────────────────────────────────────────────────
 * Multiple feature modules need SMS throughout the app lifecycle:
 *   Sprint 2.1: AuthModule        (OTP delivery)
 *   Sprint 2.2: KycModule         (document approval / rejection notifications)
 *   Sprint 3:   AgencyModule      (booking notifications to agency staff)
 *   Sprint 4:   BookingModule     (status updates to clients)
 *   Sprint 5:   NotificationModule (unified SMS + push routing)
 *
 * Making it @Global() means each feature module gets SMS_SERVICE injected
 * without adding SmsModule to their own imports array. This avoids the
 * verbosity of re-importing in every module and prevents accidental
 * creation of duplicate Twilio client instances.
 *
 * ── Provider selection ────────────────────────────────────────────────────────
 * The factory chooses the implementation at startup so switching providers
 * (Twilio → Ooredoo/Mobilis in Sprint 5) requires zero AuthService changes.
 *
 *   NODE_ENV=production + live SID  →  TwilioSmsService (real SMS, costs money)
 *   NODE_ENV=development            →  ConsoleSmsService (logs OTP to stdout)
 *   NODE_ENV=test                   →  ConsoleSmsService (silent, no noise)
 *   TWILIO_ACCOUNT_SID=placeholder  →  ConsoleSmsService (detected by SID pattern)
 *
 * ── Testing ───────────────────────────────────────────────────────────────────
 * In unit/e2e tests, override the provider with MockSmsService:
 *
 *   const module = await Test.createTestingModule({ ... })
 *     .overrideProvider(SMS_SERVICE)
 *     .useClass(MockSmsService)
 *     .compile();
 */
@Global()
@Module({
  providers: [
    TwilioSmsService,
    ConsoleSmsService,
    {
      provide: SMS_SERVICE,
      inject: [ConfigService, TwilioSmsService, ConsoleSmsService],
      useFactory: (
        config: ConfigService,
        twilio: TwilioSmsService,
        consoleSvc: ConsoleSmsService,
      ) => {
        const env = config.get<string>('NODE_ENV', 'development');
        const sid = config.get<string>('TWILIO_ACCOUNT_SID', '');

        // Detect placeholder / test credentials by common sentinel patterns
        const isPlaceholderSid =
          !sid ||
          sid === 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' ||
          sid.startsWith('ACtest');

        if (env === 'production' && !isPlaceholderSid) {
          new Logger('SmsModule').log('📱 SMS provider: Twilio [production]');
          return twilio;
        }

        new Logger('SmsModule').warn(
          `📱 SMS provider: Console [${env}] — OTP codes logged to stdout, no real SMS sent`,
        );
        return consoleSvc;
      },
    },
  ],
  exports: [SMS_SERVICE],
})
export class SmsModule {}
