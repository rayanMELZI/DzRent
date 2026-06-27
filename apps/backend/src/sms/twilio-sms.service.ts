import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio, RestException } from 'twilio';

import {
  ISmsService,
  OtpSmsPayload,
  NotificationSmsPayload,
  SmsSendResult,
} from './sms.interface';

/**
 * TwilioSmsService — production SMS provider using Twilio's REST API.
 *
 * Message design decisions:
 *  ① Bilingual (fr + ar) OTP messages — Algerian users mix both languages.
 *  ② Arabic text is appended AFTER French — Twilio renders left-to-right in SMS
 *     but the recipient's device handles RTL display.
 *  ③ "Ne partagez jamais" / "لا تشاركه" — phishing warning is mandatory
 *     in Algerian fintech applications (ABEF guidelines).
 *
 * Error handling:
 *  - Twilio errors are logged with their error code for ops debugging.
 *  - We throw InternalServerErrorException (not expose Twilio codes to clients).
 *  - Result object is returned (not thrown) for non-critical notification SMS.
 */
@Injectable()
export class TwilioSmsService implements ISmsService {
  private readonly logger = new Logger(TwilioSmsService.name);
  private readonly client: Twilio;
  private readonly fromNumber: string;

  constructor(private readonly config: ConfigService) {
    this.client = new Twilio(
      config.get<string>('TWILIO_ACCOUNT_SID')!,
      config.get<string>('TWILIO_AUTH_TOKEN')!,
    );
    this.fromNumber = config.get<string>('TWILIO_PHONE_NUMBER')!;
  }

  // ── OTP SMS ────────────────────────────────────────────────────────────────

  async sendOtp(payload: OtpSmsPayload): Promise<SmsSendResult> {
    const { to, otp, locale, validityMinutes } = payload;
    const body = this.buildOtpMessage(otp, locale, validityMinutes);

    try {
      const message = await this.client.messages.create({
        to,
        from: this.fromNumber,
        body,
      });

      this.logger.log(
        `OTP SMS sent to ${this.maskPhone(to)} — SID: ${message.sid}`,
      );

      return { success: true, externalId: message.sid };
    } catch (err: unknown) {
      return this.handleTwilioError(err, to, 'OTP');
    }
  }

  // ── Notification SMS ────────────────────────────────────────────────────────

  async sendNotification(payload: NotificationSmsPayload): Promise<SmsSendResult> {
    const { to, body } = payload;

    try {
      const message = await this.client.messages.create({
        to,
        from: this.fromNumber,
        body,
      });

      this.logger.log(
        `Notification SMS sent to ${this.maskPhone(to)} — SID: ${message.sid}`,
      );

      return { success: true, externalId: message.sid };
    } catch (err: unknown) {
      // Notification failures are non-fatal — log and return error result
      // (do NOT throw — the caller decides whether to retry or continue)
      const twilioErr = err as RestException;
      this.logger.error(
        `Notification SMS failed to ${this.maskPhone(to)}: ` +
          `[${twilioErr?.code}] ${twilioErr?.message}`,
      );
      return {
        success: false,
        errorCode: String(twilioErr?.code ?? 'UNKNOWN'),
        errorMessage: twilioErr?.message ?? 'Unknown Twilio error',
      };
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private buildOtpMessage(
    otp: string,
    locale: 'fr' | 'ar',
    validityMinutes: number,
  ): string {
    // Always bilingual — Algerian users freely mix French and Arabic.
    // French line first (matches default locale), Arabic second.
    return (
      `[DzRent] Code de vérification : ${otp}\n` +
      `كود التحقق الخاص بك : ${otp}\n` +
      `Valable ${validityMinutes} min. Ne partagez jamais ce code. / لا تشاركه مع أحد.`
    );
  }

  private handleTwilioError(
    err: unknown,
    to: string,
    context: string,
  ): never {
    const twilioErr = err as RestException;
    this.logger.error(
      `${context} SMS FAILED to ${this.maskPhone(to)}: ` +
        `code=${twilioErr?.code} status=${twilioErr?.status} msg=${twilioErr?.message}`,
    );

    // Surface a clean error to the caller — never expose Twilio internals
    throw new InternalServerErrorException(
      'Unable to send SMS verification code. Please try again in a moment.',
    );
  }

  /** Masks phone number for safe logging: +213551****67 */
  private maskPhone(phone: string): string {
    return phone.length > 6
      ? phone.slice(0, 7) + '****' + phone.slice(-2)
      : '***masked***';
  }
}
