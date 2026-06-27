import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

/**
 * AuthModule — phone OTP authentication + JWT access/refresh token rotation.
 *
 * ── Global dependencies (no explicit import needed) ───────────────────────────
 *   PrismaModule   → registered @Global() in AppModule
 *   ConfigModule   → registered @Global() in AppModule
 *   IoRedisModule  → registered @Global() in AppModule
 *   SmsModule      → registered @Global() in AppModule
 *                    Provides SMS_SERVICE token used by AuthService via @Inject()
 *
 * ── JwtModule configuration ───────────────────────────────────────────────────
 * Registered WITHOUT a default secret intentionally.
 * AuthService calls `jwtService.signAsync(payload, { secret: ..., expiresIn: ... })`
 * with an explicit secret per token type. This prevents a class of bugs where
 * access and refresh tokens are signed with the same key, allowing type confusion
 * attacks (e.g. using a refresh token as an access token by stripping the `type` claim).
 *
 * ── Passport default strategy ─────────────────────────────────────────────────
 * PassportModule.register({ defaultStrategy: 'jwt' }) sets the fallback when
 * @UseGuards(AuthGuard()) is called without a strategy name. We always use the
 * named guards (JwtAuthGuard, JwtRefreshGuard) in this codebase, but the
 * default is set for third-party library compatibility.
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}), // No default secret — intentional (see above)
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtStrategy, JwtRefreshStrategy],
})
export class AuthModule {}
