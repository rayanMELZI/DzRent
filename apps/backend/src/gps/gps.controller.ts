import { BadRequestException, Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

import { GpsService } from './gps.service';
import { GpsBatchDto } from './dto/gps.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { hmacSha256Hex, safeEqualHex } from '../common/utils/crypto.util';
import { UserRole } from '@prisma/client';

@ApiTags('gps')
@Controller('gps')
export class GpsController {
  constructor(private readonly gps: GpsService, private readonly config: ConfigService) {}

  /**
   * Device ingestion — NO JWT. Authenticated by HMAC-SHA256 of the raw body
   * using GPS_INGEST_SECRET, supplied in the x-gps-signature header.
   */
  @Post('ingest')
  @SkipThrottle()
  @ApiOperation({ summary: 'GPS tracker batch ingestion (HMAC-signed, no JWT)' })
  async ingest(@Body() dto: GpsBatchDto, @Headers('x-gps-signature') signature: string, @Req() req: Request) {
    const secret = this.config.get<string>('GPS_INGEST_SECRET')!;
    const raw = JSON.stringify(req.body);
    const expected = hmacSha256Hex(secret, raw);
    if (!signature || !safeEqualHex(signature, expected)) {
      throw new BadRequestException('Invalid GPS signature.');
    }
    return { success: true, data: await this.gps.ingest(dto.pings) };
  }

  @Get('vehicle/:vehicleId/latest')
  @ApiBearerAuth('access-token') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.AGENCY_OWNER, UserRole.AGENCY_STAFF)
  async latest(@Param('vehicleId', ParseUUIDPipe) vehicleId: string, @CurrentUser() caller: AuthenticatedUser) {
    return { success: true, data: await this.gps.latest(vehicleId, caller) };
  }

  @Get('vehicle/:vehicleId/history')
  @ApiBearerAuth('access-token') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.AGENCY_OWNER, UserRole.AGENCY_STAFF)
  async history(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string, @CurrentUser() caller: AuthenticatedUser,
    @Query('from') from: string, @Query('to') to: string, @Query('limit') limit = '500',
  ) {
    return { success: true, data: await this.gps.history(vehicleId, caller, from, to, Number(limit)) };
  }
}
