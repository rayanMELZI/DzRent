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

  /** In-app notification center: the caller's own log, newest first. */
  async listMine(userId: string, page = 1, limit = 20) {
    const where = { userId };
    const [items, total, unread] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
        select: { id: true, channel: true, templateId: true, payload: true, isDelivered: true, readAt: true, createdAt: true },
      }),
      this.prisma.notificationLog.count({ where }),
      this.prisma.notificationLog.count({ where: { userId, readAt: null } }),
    ]);
    return { items, total, unread, page };
  }

  /** Mark every unread notification as read (opening the center reads all). */
  async markAllRead(userId: string) {
    const { count } = await this.prisma.notificationLog.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { marked: count };
  }

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
