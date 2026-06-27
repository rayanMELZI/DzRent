import { Injectable, Logger } from '@nestjs/common';

import {
  ISmsService,
  OtpSmsPayload,
  NotificationSmsPayload,
  SmsSendResult,
} from './sms.interface';

/**
 * ConsoleSmsService — development-only SMS mock.
 *
 * Prints OTP codes directly to stdout so developers don't need a
 * real Twilio account or an Algerian SIM during local development.
 *
 * Activated when NODE_ENV=development or when TWILIO_ACCOUNT_SID
 * starts with the Twilio test prefix 'ACtest' (see SmsModule factory).
 *
 * ⚠️  NEVER register this as the production provider.
 */
@Injectable()
export class ConsoleSmsService implements ISmsService {
  private readonly logger = new Logger('📱 ConsoleSms [DEV]');

  async sendOtp(payload: OtpSmsPayload): Promise<SmsSendResult> {
    const { to, otp, validityMinutes } = payload;

    // Print prominently so it's easy to spot in dev server output
    this.logger.warn(
      `\n${'─'.repeat(50)}\n` +
        `  📲  OTP for ${to}\n` +
        `  🔑  Code : ${otp}\n` +
        `  ⏱   Valid for ${validityMinutes} minutes\n` +
        `${'─'.repeat(50)}`,
    );

    return { success: true, externalId: `console_${Date.now()}` };
  }

  async sendNotification(payload: NotificationSmsPayload): Promise<SmsSendResult> {
    this.logger.log(`[NOTIFICATION → ${payload.to}]\n${payload.body}`);
    return { success: true, externalId: `console_notif_${Date.now()}` };
  }
}
