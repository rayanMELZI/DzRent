/**
 * DzRent — SMS Service Abstraction
 *
 * Why an interface?
 *   ① Tests inject a MockSmsService — no Twilio calls, no cost, instant.
 *   ② Local dev can use a ConsoleSmsService that just logs the OTP.
 *   ③ Adding Ooredoo/Mobilis fallback in Sprint 5 is a new implementation,
 *      not a change to AuthService.
 *
 * Injection token: SMS_SERVICE (InjectionToken constant below).
 * Never inject TwilioSmsService directly — always use the token.
 */

export const SMS_SERVICE = Symbol('SMS_SERVICE');

export interface OtpSmsPayload {
  /** Destination in E.164 format (+213XXXXXXXXX) */
  to: string;
  /** 6-digit OTP code */
  otp: string;
  /** Drives language selection in the SMS body */
  locale: 'fr' | 'ar';
  /** Minutes until the OTP expires */
  validityMinutes: number;
}

export interface NotificationSmsPayload {
  to: string;
  /** Pre-rendered message body (caller handles i18n) */
  body: string;
}

export interface SmsSendResult {
  success: boolean;
  externalId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface ISmsService {
  sendOtp(payload: OtpSmsPayload): Promise<SmsSendResult>;
  sendNotification(payload: NotificationSmsPayload): Promise<SmsSendResult>;
}
