import { Injectable } from '@nestjs/common';

import {
  ISmsService,
  OtpSmsPayload,
  NotificationSmsPayload,
  SmsSendResult,
} from './sms.interface';

/**
 * MockSmsService — in-memory SMS implementation for tests.
 *
 * Captures every sent message so tests can assert on SMS content
 * without any network calls or Twilio credentials.
 *
 * ── Usage in unit tests ───────────────────────────────────────────────────────
 *
 *   const module = await Test.createTestingModule({
 *     imports: [AuthModule],
 *   })
 *     .overrideProvider(SMS_SERVICE)
 *     .useClass(MockSmsService)
 *     .compile();
 *
 *   const sms = module.get<MockSmsService>(SMS_SERVICE);
 *
 *   await authService.requestOtp({ phone: '+213551234567' });
 *
 *   // Assert the OTP was "sent"
 *   expect(sms.sentOtps).toHaveLength(1);
 *   expect(sms.sentOtps[0].to).toBe('+213551234567');
 *   const otpCode = sms.sentOtps[0].otp; // grab code for verify step
 *
 * ── Failure simulation ────────────────────────────────────────────────────────
 *
 *   sms.simulateFailure = true;
 *   await expect(authService.requestOtp({ phone: '+213551234567' }))
 *     .rejects.toThrow(InternalServerErrorException);
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Injectable()
export class MockSmsService implements ISmsService {
  /** All OTP messages captured during the test run */
  sentOtps: OtpSmsPayload[] = [];

  /** All notification messages captured during the test run */
  sentNotifications: NotificationSmsPayload[] = [];

  /**
   * Set to true to make the next send() call return a failure result
   * and throw InternalServerErrorException (mirrors TwilioSmsService behaviour).
   */
  simulateFailure = false;

  async sendOtp(payload: OtpSmsPayload): Promise<SmsSendResult> {
    if (this.simulateFailure) {
      throw new Error('MockSmsService: simulated SMS failure');
    }
    this.sentOtps.push(payload);
    return {
      success: true,
      externalId: `mock_otp_${Date.now()}`,
    };
  }

  async sendNotification(
    payload: NotificationSmsPayload,
  ): Promise<SmsSendResult> {
    if (this.simulateFailure) {
      return {
        success: false,
        errorCode: 'MOCK_FAILURE',
        errorMessage: 'MockSmsService: simulated notification failure',
      };
    }
    this.sentNotifications.push(payload);
    return {
      success: true,
      externalId: `mock_notif_${Date.now()}`,
    };
  }

  /** Returns the most recently captured OTP code. Throws if no OTPs sent. */
  getLastOtpCode(): string {
    if (this.sentOtps.length === 0) {
      throw new Error('MockSmsService: no OTPs have been sent yet');
    }
    return this.sentOtps[this.sentOtps.length - 1].otp;
  }

  /** Clears captured messages. Call in beforeEach() to isolate tests. */
  reset(): void {
    this.sentOtps = [];
    this.sentNotifications = [];
    this.simulateFailure = false;
  }
}
