import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import * as bcrypt from 'bcryptjs';
import { randomInt, randomUUID } from 'crypto';
import { UserRole, UserStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { SMS_SERVICE, ISmsService } from '../sms/sms.interface';
import { RequestOtpDto, VerifyOtpDto } from './dto/auth.dto';
import {
  JwtPayload,
  JwtRefreshPayload,
} from './interfaces/jwt-payload.interface';
import { addMinutes, nowUtc } from '../common/utils/date.util';
import { TooManyRequestsException } from '../common/exceptions/app.exceptions';
import { sha256Hex, safeEqualHex } from '../common/utils/crypto.util';

// ─────────────────────────────────────────────────────────────────────────────
// Redis key factories — centralised so key patterns are never typo'd elsewhere
// ─────────────────────────────────────────────────────────────────────────────
const Keys = {
  otpCooldown:      (phone: string)              => `dzrent:otp:cooldown:${phone}`,
  refreshToken:     (userId: string, jti: string) => `dzrent:refresh:${userId}:${jti}`,
  allRefreshTokens: (userId: string)              => `dzrent:refresh:${userId}:*`,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Return types (exported so controllers can use them in their response types)
// ─────────────────────────────────────────────────────────────────────────────
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** Seconds until the access token expires */
  expiresIn: number;
}

export interface AuthResult extends TokenPair {
  user: {
    id: string;
    phone: string;
    firstName: string;
    lastName: string;
    role: string;
    locale: string;
    /** true on first successful OTP verification (registration flow) */
    isNewUser: boolean;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Cost factor 10 → ~100ms/hash on a modern server.
// OTP hashes use the same cost as password hashes — they are equally sensitive.
// ─────────────────────────────────────────────────────────────────────────────
const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Kept in sync with PlatformConfig seed values (src/prisma/seed.ts).
  // In Sprint 3 these will be read from PlatformConfig at runtime.
  private readonly OTP_VALIDITY_MINUTES     = 10;
  private readonly OTP_MAX_ATTEMPTS         = 5;
  private readonly OTP_LOCKOUT_MINUTES      = 30;
  private readonly OTP_RESEND_COOLDOWN_SECS = 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRedis()      private readonly redis:      Redis,
    @Inject(SMS_SERVICE) private readonly smsService: ISmsService,
  ) {}

  // ── REQUEST OTP ─────────────────────────────────────────────────────────────

  /**
   * Generates a 6-digit OTP, hashes it (bcrypt), stores it in the DB,
   * sends it via ISmsService, then sets a per-phone Redis cooldown.
   *
   * ── Cooldown ordering (deliberately: save → SMS → cooldown) ──────────────
   * The cooldown is set AFTER a successful SMS delivery.
   *
   * Why? If Twilio is down and the send throws, the user never receives the
   * code. Setting the cooldown before the send would lock them out for 60 s
   * from a service error they didn't cause. Setting it after means:
   *   • Success path: save → send → cooldown. Normal flow.
   *   • Twilio failure: save → THROW. No cooldown set; user can retry immediately
   *     without waiting. The bcrypt hash computation (~100ms) is still a natural
   *     rate limiter against tight-loop abuse.
   *
   * The trade-off: a caller could hammer request-otp if SMS keeps failing. The
   * outer ThrottlerGuard (3 req/min/IP on this endpoint) prevents that scenario.
   *
   * ── Rate limiting layers ──────────────────────────────────────────────────
   *  ① ThrottlerGuard:  3 req/60 s per IP (in AuthController)
   *  ② Redis cooldown:  60 s per phone number (set here, after SMS success)
   *  ③ DB lock:         User.otpAttempts → lock after OTP_MAX_ATTEMPTS failures
   */
  async requestOtp(dto: RequestOtpDto): Promise<{ message: string }> {
    const { phone } = dto;

    // ── Layer 1 (Redis): per-phone resend cooldown ───────────────────────
    const cooldownTtl = await this.redis.ttl(Keys.otpCooldown(phone));
    if (cooldownTtl > 0) {
      throw new TooManyRequestsException(
        `Please wait ${cooldownTtl} second(s) before requesting a new code.`,
      );
    }

    // ── Existing user checks ─────────────────────────────────────────────
    const existingUser = await this.prisma.user.findUnique({
      where: { phone },
      select: { id: true, status: true, otpAttempts: true, otpExpiresAt: true },
    });

    if (existingUser) {
      if (existingUser.status === UserStatus.BANNED) {
        throw new UnauthorizedException('This account has been permanently banned.');
      }

      // ── Layer 3 (DB): account-level lockout check ────────────────────
      const isLocked =
        existingUser.otpAttempts >= this.OTP_MAX_ATTEMPTS &&
        existingUser.otpExpiresAt !== null &&
        existingUser.otpExpiresAt > nowUtc();

      if (isLocked) {
        const remainingMs   = existingUser.otpExpiresAt!.getTime() - nowUtc().getTime();
        const remainingMin  = Math.ceil(remainingMs / 60_000);
        throw new TooManyRequestsException(
          `Account temporarily locked. Try again in ${remainingMin} minute(s).`,
        );
      }
    }

    // ── Generate + hash OTP ──────────────────────────────────────────────
    const otpCode     = this.generateOtp();
    const otpHash     = await bcrypt.hash(otpCode, BCRYPT_ROUNDS);
    const otpExpiresAt = addMinutes(nowUtc(), this.OTP_VALIDITY_MINUTES);

    // ── Persist OTP to DB (upsert: create on first request, reset on resend) ─
    await this.prisma.user.upsert({
      where: { phone },
      create: {
        phone,
        firstName: 'Pending',        // Replaced when OTP is verified
        lastName:  'Verification',
        otpHash,
        otpExpiresAt,
        otpAttempts: 0,
        status: UserStatus.PENDING_VERIFICATION,
      },
      update: {
        otpHash,
        otpExpiresAt,
        otpAttempts: 0,              // Reset counter; user is starting fresh
      },
    });

    // ── Send SMS BEFORE setting cooldown ─────────────────────────────────
    // If sendOtp() throws (Twilio down / invalid number), the exception
    // propagates here; no cooldown is set; user can retry immediately.
    const smsResult = await this.smsService.sendOtp({
      to:              phone,
      otp:             otpCode,
      locale:          'fr',         // Default; updated at verify-otp step
      validityMinutes: this.OTP_VALIDITY_MINUTES,
    });

    if (!smsResult.success) {
      // Non-throwing SMS providers (ConsoleSmsService never fails; this covers
      // any future ISmsService implementation that returns instead of throwing)
      this.logger.error(
        `SMS delivery failed for ${this.maskPhone(phone)}: ` +
          `[${smsResult.errorCode}] ${smsResult.errorMessage}`,
      );
      throw new InternalServerErrorException(
        'Unable to send verification SMS. Please try again.',
      );
    }

    // ── Set per-phone cooldown AFTER successful SMS delivery ─────────────
    await this.redis.setex(
      Keys.otpCooldown(phone),
      this.OTP_RESEND_COOLDOWN_SECS,
      '1',
    );

    this.logger.log(
      `OTP requested: ${this.maskPhone(phone)} — sid:${smsResult.externalId ?? 'console'}`,
    );

    return {
      message:
        `A verification code has been sent to ${phone}. ` +
        `It expires in ${this.OTP_VALIDITY_MINUTES} minutes.`,
    };
  }

  // ── VERIFY OTP ──────────────────────────────────────────────────────────────

  /**
   * Verifies the submitted OTP against the stored bcrypt hash.
   *
   * Registration path (user.status = PENDING_VERIFICATION):
   *   firstName + lastName are REQUIRED — enforced here, not just in the DTO,
   *   because the DTO marks them optional (they are optional for returning users).
   *
   * Login path (user.status = ACTIVE):
   *   firstName/lastName are ignored even if provided.
   *
   * On success: account is ACTIVE, OTP fields are cleared, JWT pair returned.
   * On failure: otpAttempts++; lock triggered at OTP_MAX_ATTEMPTS.
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<AuthResult> {
    const { phone, otp, firstName, lastName, locale = 'fr' } = dto;

    const user = await this.prisma.user.findUnique({
      where: { phone },
      select: {
        id:           true,
        status:       true,
        otpHash:      true,
        otpExpiresAt: true,
        otpAttempts:  true,
        firstName:    true,
        lastName:     true,
        role:         true,
        locale:       true,
      },
    });

    // Guard: OTP must have been requested first
    if (!user?.otpHash || !user.otpExpiresAt) {
      throw new UnauthorizedException(
        'No pending verification found for this number. Please request a new code.',
      );
    }

    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedException('This account has been permanently banned.');
    }

    // Guard: OTP expiry
    if (user.otpExpiresAt < nowUtc()) {
      throw new UnauthorizedException(
        'This verification code has expired. Please request a new one.',
      );
    }

    // Verify bcrypt hash
    const isValid = await bcrypt.compare(otp, user.otpHash);

    if (!isValid) {
      const newAttempts = user.otpAttempts + 1;
      const shouldLock  = newAttempts >= this.OTP_MAX_ATTEMPTS;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          otpAttempts: newAttempts,
          // Extend expiry on lockout to create the cooldown window
          ...(shouldLock && {
            otpExpiresAt: addMinutes(nowUtc(), this.OTP_LOCKOUT_MINUTES),
          }),
        },
      });

      if (shouldLock) {
        this.logger.warn(
          `OTP lockout: ${this.maskPhone(phone)} after ${newAttempts} attempts`,
        );
        throw new TooManyRequestsException(
          `Too many failed attempts. Account locked for ${this.OTP_LOCKOUT_MINUTES} minutes.`,
        );
      }

      const remaining = this.OTP_MAX_ATTEMPTS - newAttempts;
      throw new UnauthorizedException(
        `Invalid verification code. ${remaining} attempt(s) remaining.`,
      );
    }

    // ── OTP valid ─────────────────────────────────────────────────────────
    const isNewUser = user.status === UserStatus.PENDING_VERIFICATION;

    if (isNewUser && (!firstName?.trim() || !lastName?.trim())) {
      throw new BadRequestException(
        'firstName and lastName are required to complete registration.',
      );
    }

    // Activate account + clear OTP state
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        status:       UserStatus.ACTIVE,
        otpHash:      null,
        otpExpiresAt: null,
        otpAttempts:  0,
        lastLoginAt:  nowUtc(),
        locale,
        ...(isNewUser && {
          firstName: firstName!.trim(),
          lastName:  lastName!.trim(),
        }),
      },
      select: {
        id:        true,
        phone:     true,
        firstName: true,
        lastName:  true,
        role:      true,
        locale:    true,
      },
    });

    const tokens = await this.issueTokenPair(updatedUser.id, {
      phone:  updatedUser.phone,
      role:   updatedUser.role,
      locale: updatedUser.locale as 'fr' | 'ar',
    });

    this.logger.log(
      `${isNewUser ? '🆕 Registered' : '🔑 Login'}: ${this.maskPhone(phone)}`,
    );

    return {
      ...tokens,
      user: {
        id:        updatedUser.id,
        phone:     updatedUser.phone,
        firstName: updatedUser.firstName,
        lastName:  updatedUser.lastName,
        role:      updatedUser.role,
        locale:    updatedUser.locale,
        isNewUser,
      },
    };
  }

  // ── REFRESH TOKENS ──────────────────────────────────────────────────────────

  /**
   * Validates the refresh token against the Redis-stored bcrypt hash,
   * then issues a new access + refresh token pair (rotation).
   *
   * Hash mismatch after signature verification = token was forged or reused.
   * Response: revoke ALL sessions for this user (breach containment).
   */
  async refreshTokens(
    userId: string,
    jti:    string,
    rawToken: string,
  ): Promise<TokenPair> {
    const storedHash = await this.redis.get(Keys.refreshToken(userId, jti));

    if (!storedHash) {
      throw new UnauthorizedException(
        'This refresh token has expired or been revoked.',
      );
    }

    const isMatch = safeEqualHex(sha256Hex(rawToken), storedHash);
    if (!isMatch) {
      await this.revokeAllSessions(userId);
      this.logger.error(
        `⚠️  Refresh token hash mismatch for user ${userId}. All sessions revoked.`,
      );
      throw new UnauthorizedException(
        'Security violation detected. All sessions have been invalidated.',
      );
    }

    // Rotate: delete old JTI before issuing new pair
    await this.redis.del(Keys.refreshToken(userId, jti));

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { id: true, phone: true, role: true, locale: true, status: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active.');
    }

    return this.issueTokenPair(user.id, {
      phone:  user.phone,
      role:   user.role,
      locale: user.locale as 'fr' | 'ar',
    });
  }

  // ── LOGOUT ──────────────────────────────────────────────────────────────────

  /** Revokes the current device's refresh token. Other devices stay logged in. */
  async logout(userId: string, jti: string): Promise<{ message: string }> {
    await this.redis.del(Keys.refreshToken(userId, jti));
    this.logger.log(`Logout: user=${userId} jti=${jti}`);
    return { message: 'You have been logged out successfully.' };
  }

  /**
   * Revokes ALL refresh tokens for a user (all devices). Security events only.
   * AUDIT FIX B5: uses SCAN (non-blocking) instead of KEYS, which blocks the
   * Redis event loop and can stall every other request under load.
   */
  async revokeAllSessions(userId: string): Promise<void> {
    const pattern = Keys.allRefreshTokens(userId);
    let deleted = 0;
    const stream = this.redis.scanStream({ match: pattern, count: 100 });
    for await (const batch of stream) {
      const keys = batch as string[];
      if (keys.length > 0) {
        deleted += await this.redis.del(...keys);
      }
    }
    this.logger.warn(`All sessions revoked: user=${userId} (${deleted} tokens)`);
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private async issueTokenPair(
    userId: string,
    data: { phone: string; role: UserRole; locale: string },
  ): Promise<TokenPair> {
    const jti = randomUUID();

    const accessPayload: JwtPayload = {
      sub:    userId,
      phone:  data.phone,
      role:   data.role,
      locale: data.locale as 'fr' | 'ar',
      type:   'access',
    };

    const refreshPayload: JwtRefreshPayload = {
      sub:  userId,
      jti,
      type: 'refresh',
    };

    const jwtSecret           = this.config.get<string>('JWT_SECRET')!;
    const jwtRefreshSecret    = this.config.get<string>('JWT_REFRESH_SECRET')!;
    const jwtExpiresIn        = this.config.get<string>('JWT_EXPIRES_IN', '15m');
    const jwtRefreshExpiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret:    jwtSecret,
        expiresIn: jwtExpiresIn,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret:    jwtRefreshSecret,
        expiresIn: jwtRefreshExpiresIn,
      }),
    ]);

    // Store hashed refresh token in Redis (TTL = token lifetime → auto-cleanup)
    const refreshTtlSeconds = this.parseDurationToSeconds(jwtRefreshExpiresIn);
    // AUDIT FIX B2: sha256, NOT bcrypt — bcrypt truncates at 72 bytes which made
    // every refresh token of a user hash identically (see crypto.util.ts).
    const refreshHash       = sha256Hex(refreshToken);

    await this.redis.setex(
      Keys.refreshToken(userId, jti),
      refreshTtlSeconds,
      refreshHash,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseDurationToSeconds(jwtExpiresIn),
    };
  }

  /** Cryptographically random 6-digit string, zero-padded: "042381" */
  private generateOtp(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  /** Masks phone for safe logging: +213551234567 → +213551****67 */
  private maskPhone(phone: string): string {
    return phone.length > 6
      ? phone.slice(0, 7) + '****' + phone.slice(-2)
      : '***';
  }

  /** "15m" → 900, "7d" → 604800 */
  private parseDurationToSeconds(duration: string): number {
    const multipliers: Record<string, number> = {
      s: 1, m: 60, h: 3_600, d: 86_400,
    };
    const unit  = duration.slice(-1);
    const value = parseInt(duration.slice(0, -1), 10);
    return value * (multipliers[unit] ?? 60);
  }
}
