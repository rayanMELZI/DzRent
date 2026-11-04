import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { RequestOtpDto, VerifyOtpDto } from './dto/auth.dto';
import { JwtAuthGuard, JwtRefreshGuard } from './guards/auth.guards';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { JwtRefreshPayload } from './interfaces/jwt-payload.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── POST /api/v1/auth/request-otp ─────────────────────────────────────────

  /**
   * Step 1: Send OTP via SMS to an Algerian mobile number.
   *
   * Throttle: 3 requests per 60 seconds per IP.
   * Additional per-phone cooldown is enforced in AuthService via Redis.
   */
  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Request OTP',
    description:
      'Sends a 6-digit OTP via SMS to the provided Algerian mobile number. ' +
      'Rate limited to 3 requests per minute per IP. ' +
      'A 60-second per-phone cooldown is enforced between resend requests.',
  })
  @ApiResponse({ status: 200, description: 'OTP sent successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid phone number format.' })
  @ApiResponse({ status: 429, description: 'Too many requests — cooldown active.' })
  async requestOtp(@Body() dto: RequestOtpDto): Promise<{ success: true; message: string }> {
    const result = await this.authService.requestOtp(dto);
    return { success: true, ...result };
  }

  // ── POST /api/v1/auth/verify-otp ──────────────────────────────────────────

  /**
   * Step 2: Verify OTP and receive JWT token pair.
   *
   * Handles both registration (new user) and login (existing user).
   * For new users, firstName + lastName are required.
   */
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Verify OTP / Login or Register',
    description:
      'Validates the OTP received via SMS. Returns an access token (15 min) ' +
      'and a refresh token (7 days). For first-time users, firstName and lastName ' +
      'must be provided.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful.',
    schema: {
      example: {
        success: true,
        accessToken: 'eyJ...',
        refreshToken: 'eyJ...',
        expiresIn: 900,
        user: {
          id: 'uuid',
          phone: '+213551234567',
          firstName: 'Mohamed',
          lastName: 'Bensalem',
          role: 'CLIENT',
          locale: 'fr',
          isNewUser: false,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP.' })
  @ApiResponse({ status: 429, description: 'Account locked — too many attempts.' })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
  ): Promise<{ success: true } & Awaited<ReturnType<AuthService['verifyOtp']>>> {
    const result = await this.authService.verifyOtp(dto);
    return { success: true, ...result };
  }

  // ── POST /api/v1/auth/refresh ─────────────────────────────────────────────

  /**
   * Issues a new access + refresh token pair using a valid refresh token.
   * Implements refresh token rotation: the old token is revoked on use.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth('refresh-token')
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Exchange a valid refresh token for a new access + refresh token pair. ' +
      'The provided refresh token is revoked immediately (rotation). ' +
      'Send the refresh token in the Authorization: Bearer <token> header.',
  })
  @ApiResponse({ status: 200, description: 'New token pair issued.' })
  @ApiResponse({ status: 401, description: 'Refresh token invalid or revoked.' })
  async refresh(
    @CurrentUser() payload: JwtRefreshPayload & { rawToken: string },
  ): Promise<{ success: true } & Awaited<ReturnType<AuthService['refreshTokens']>>> {
    const result = await this.authService.refreshTokens(payload.sub, payload.jti, payload.rawToken);
    return { success: true, ...result };
  }

  // ── POST /api/v1/auth/logout ──────────────────────────────────────────────

  /**
   * Revokes the current refresh token (single device logout).
   * The access token remains valid until its natural expiry (15 min).
   * Clients should discard both tokens locally on logout.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth('refresh-token')
  @ApiOperation({
    summary: 'Logout (revoke refresh token)',
    description:
      'Revokes the provided refresh token. The short-lived access token ' +
      'will naturally expire. Send the refresh token in the Authorization header.',
  })
  @ApiResponse({ status: 200, description: 'Logged out successfully.' })
  async logout(
    @CurrentUser() payload: JwtRefreshPayload & { rawToken: string },
  ): Promise<{ success: true; message: string }> {
    const result = await this.authService.logout(payload.sub, payload.jti);
    return { success: true, ...result };
  }

  // ── GET /api/v1/auth/me ───────────────────────────────────────────────────

  /** Quick auth check — returns the authenticated user from the access token. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user from access token' })
  @ApiResponse({ status: 200, description: 'Current authenticated user.' })
  @ApiResponse({ status: 401, description: 'Not authenticated.' })
  getMe(@CurrentUser() user: AuthenticatedUser): { success: true; user: AuthenticatedUser } {
    return { success: true, user };
  }
}
