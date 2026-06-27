import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { SMS_SERVICE, ISmsService } from '../sms/sms.interface';
import { renderTemplate } from './templates';

/**
 * NotificationsService — single entry point for outbound user comms.
 * Persists every attempt to NotificationLog (audit + retry in Sprint 5 jobs).
 * SMS-first per Algerian market reality; push/email channels are Sprint 5+.
 * Failures never throw to the caller — a booking must not fail because an
 * SMS gateway hiccupped.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(SMS_SERVICE) private readonly sms: ISmsService,
  ) {}

  async sendSms(params: {
    userId: string;
    phone: string;
    locale: 'fr' | 'ar';
    templateId: string;
    vars: Record<string, string | number>;
  }): Promise<void> {
    const { userId, phone, locale, templateId, vars } = params;
    const templateKey = `${templateId}_${locale.toUpperCase()}`;
    let body = '';
    try {
      body = renderTemplate(templateId, locale, vars);
      const result = await this.sms.sendNotification({ to: phone, body });
      await this.prisma.notificationLog.create({
        data: {
          userId, channel: NotificationChannel.SMS, templateId: templateKey,
          payload: { body, vars } as never,
          isDelivered: result.success,
          deliveredAt: result.success ? new Date() : null,
          failureReason: result.success ? null : `${result.errorCode}: ${result.errorMessage}`,
          externalRef: result.externalId,
        },
      });
    } catch (e) {
      this.logger.error(`Notification failed [${templateKey} → ${phone.slice(0, 7)}***]`, e as Error);
      await this.prisma.notificationLog.create({
        data: {
          userId, channel: NotificationChannel.SMS, templateId: templateKey,
          payload: { body, vars } as never, isDelivered: false,
          failureReason: (e as Error).message,
        },
      }).catch(() => undefined);
    }
  }
}
