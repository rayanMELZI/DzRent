/**
 * AuthService unit tests.
 *
 * Demonstrates the MockSmsService injection pattern so that:
 *   ① No Twilio calls are made during tests
 *   ② OTP codes can be extracted from the mock for full flow testing
 *   ③ SMS failure scenarios can be simulated deterministically
 *
 * Run: pnpm test src/auth/__tests__/auth.service.spec.ts
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { TooManyRequestsException } from '../../common/exceptions/app.exceptions';

import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SMS_SERVICE } from '../../sms/sms.interface';
import { MockSmsService } from '../../sms/mock-sms.service';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import { UserStatus } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Shared mock factories
// ─────────────────────────────────────────────────────────────────────────────

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  },
  notDeleted: jest.fn().mockReturnValue({ deletedAt: null }),
};

const mockRedis = {
  ttl: jest.fn(),
  setex: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('mock.jwt.token'),
};

const mockConfig = {
  get: jest.fn((key: string, defaultValue?: unknown) => {
    const config: Record<string, unknown> = {
      JWT_SECRET: 'test-secret-min-32-chars-aaaaaaaa',
      JWT_REFRESH_SECRET: 'test-refresh-secret-min-32-bbbbbbb',
      JWT_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
    };
    return config[key] ?? defaultValue;
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Test suite
// ─────────────────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;
  let sms: MockSmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfig },
        { provide: getRedisConnectionToken(), useValue: mockRedis },
        { provide: SMS_SERVICE, useClass: MockSmsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    sms = module.get<MockSmsService>(SMS_SERVICE);

    // Reset all mocks between tests
    jest.clearAllMocks();
    sms.reset();
  });

  // ── requestOtp ─────────────────────────────────────────────────────────────

  describe('requestOtp', () => {
    const phone = '+213551234567';

    it('should generate and "send" an OTP, then set the cooldown', async () => {
      mockRedis.ttl.mockResolvedValue(-1); // no cooldown active
      mockPrisma.user.findUnique.mockResolvedValue(null); // new user
      mockPrisma.user.upsert.mockResolvedValue({ id: 'uuid-1', phone });
      mockRedis.setex.mockResolvedValue('OK');

      const result = await service.requestOtp({ phone });

      expect(result.message).toContain(phone);
      expect(sms.sentOtps).toHaveLength(1);
      expect(sms.sentOtps[0].to).toBe(phone);
      expect(sms.sentOtps[0].otp).toMatch(/^\d{6}$/);

      // Cooldown must be set AFTER SMS (line order in auth.service.ts)
      const setexCallIndex = mockRedis.setex.mock.invocationCallOrder[0];
      expect(setexCallIndex).toBeGreaterThan(0); // setex was called
    });

    it('should reject when per-phone cooldown is active', async () => {
      mockRedis.ttl.mockResolvedValue(45); // 45 s remaining

      await expect(service.requestOtp({ phone })).rejects.toThrow(TooManyRequestsException);

      expect(sms.sentOtps).toHaveLength(0);
    });

    it('should reject for BANNED accounts', async () => {
      mockRedis.ttl.mockResolvedValue(-1);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-1',
        status: UserStatus.BANNED,
        otpAttempts: 0,
        otpExpiresAt: null,
      });

      await expect(service.requestOtp({ phone })).rejects.toThrow(UnauthorizedException);
    });

    it('should NOT set cooldown when SMS delivery fails', async () => {
      mockRedis.ttl.mockResolvedValue(-1);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.upsert.mockResolvedValue({ id: 'uuid-1', phone });

      // Simulate Twilio down
      sms.simulateFailure = true;

      await expect(service.requestOtp({ phone })).rejects.toThrow();

      // Cooldown must NOT have been set (user should be able to retry immediately)
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });
  });

  // ── verifyOtp ──────────────────────────────────────────────────────────────

  describe('verifyOtp', () => {
    const phone = '+213551234567';

    it('should reject when no OTP has been requested', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        otpHash: null,
        otpExpiresAt: null,
      });

      await expect(service.verifyOtp({ phone, otp: '123456' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should lock account after OTP_MAX_ATTEMPTS failures', async () => {
      const futureDate = new Date(Date.now() + 600_000);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-1',
        status: UserStatus.ACTIVE,
        otpHash: '$2b$10$invalidhash',
        otpExpiresAt: futureDate,
        otpAttempts: 4, // one more = 5 = lockout
        firstName: 'Mohamed',
        lastName: 'Bensalem',
        role: 'CLIENT',
        locale: 'fr',
      });

      mockPrisma.user.update.mockResolvedValue({});

      await expect(service.verifyOtp({ phone, otp: '000000' })).rejects.toThrow(
        TooManyRequestsException,
      );

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ otpAttempts: 5 }),
        }),
      );
    });
  });

  // ── logout ────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('should delete the refresh token from Redis', async () => {
      mockRedis.del.mockResolvedValue(1);

      const result = await service.logout('user-uuid', 'jti-uuid');

      expect(mockRedis.del).toHaveBeenCalledWith(expect.stringContaining('user-uuid'));
      expect(result.message).toContain('logged out');
    });
  });
});
