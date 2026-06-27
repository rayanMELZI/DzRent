import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { FullUserInterceptor } from '../common/interceptors/full-user.interceptor';

/**
 * UsersModule — profile management for all user roles.
 *
 * ── Global dependencies (no explicit import needed) ───────────────────────────
 *   PrismaModule   → @Global() — PrismaService injected everywhere
 *   ConfigModule   → @Global()
 *
 * ── Exported providers ───────────────────────────────────────────────────────
 *   UsersService      → re-exported for future modules that need user lookups
 *                       (KycModule needs it to set nationalIdNumber after approval)
 *   FullUserInterceptor → exported so other modules can use @UseInterceptors(FullUserInterceptor)
 *                         without importing UsersModule (it's stateless, PrismaService is its
 *                         only dependency which is global)
 */
@Module({
  controllers: [UsersController],
  providers: [UsersService, FullUserInterceptor],
  exports: [UsersService, FullUserInterceptor],
})
export class UsersModule {}
