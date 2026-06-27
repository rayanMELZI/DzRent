import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';

import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { SmsModule } from './sms/sms.module';
import { StorageModule } from './storage/storage.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PlatformConfigModule } from './platform-config/platform-config.module';
import { FraudModule } from './fraud/fraud.module';
import { PricingModule } from './pricing/pricing.module';
import { AgencyContextMiddleware } from './common/middleware/agency-context.middleware';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { KycModule } from './kyc/kyc.module';
import { AgenciesModule } from './agencies/agencies.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { BookingsModule } from './bookings/bookings.module';
import { ContractsModule } from './contracts/contracts.module';
import { PaymentsModule } from './payments/payments.module';
import { BlacklistModule } from './blacklist/blacklist.module';
import { GpsModule } from './gps/gps.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // ── Global infrastructure ─────────────────────────────────────────────
    AppConfigModule,
    PrismaModule,
    RedisModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: config.get<string>('REDIS_URL', 'redis://localhost:6379'),
        options: { maxRetriesPerRequest: 3, enableReadyCheck: false },
      }),
      inject: [ConfigService],
    }),
    SmsModule,            // @Global — SMS_SERVICE token
    StorageModule,        // @Global — S3/MinIO presigned URLs
    AuditModule,          // @Global — append-only audit trail helper
    NotificationsModule,  // @Global — SMS templates fr/ar + NotificationLog
    PlatformConfigModule, // @Global — cached PlatformConfig reads
    FraudModule,          // @Global — signals + riskScore recompute
    PricingModule,        // @Global — rate resolution + quote engine

    // ── Rate limiting ─────────────────────────────────────────────────────
    // AUDIT FIX B4: ThrottlerModule alone does nothing — the guard must be
    // bound (APP_GUARD below). Without it every @Throttle() decorator on the
    // OTP endpoints was inert and the SMS budget was unprotected.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 60 }]),

    // ── Feature modules ───────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    KycModule,        // Sprint 2.2
    AgenciesModule,   // Sprint 2.3
    VehiclesModule,   // Sprint 3
    BookingsModule,   // Sprint 4
    ContractsModule,  // Sprint 3/4
    PaymentsModule,   // Sprint 5
    BlacklistModule,  // Sprint 5
    GpsModule,        // Sprint 5
    AdminModule,      // Sprint 5
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard }, // AUDIT FIX B4
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AgencyContextMiddleware).forRoutes('*');
  }
}
