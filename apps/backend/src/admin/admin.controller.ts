import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { FraudService } from '../fraud/fraud.service';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class SetConfigDto {
  @IsString() key: string;
  value: unknown;
  @IsOptional() @IsString() description?: string;
}

@ApiTags('admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly platformConfig: PlatformConfigService,
    private readonly fraud: FraudService,
  ) {}

  @Get('config')
  @ApiOperation({ summary: '[ADMIN] List all platform config keys' })
  async config() {
    return { success: true, data: await this.platformConfig.getAll() };
  }

  @Put('config')
  @ApiOperation({ summary: '[ADMIN] Upsert a platform config key' })
  async setConfig(@Body() dto: SetConfigDto, @CurrentUser('id') adminId: string) {
    await this.platformConfig.set(dto.key, dto.value, adminId);
    return { success: true, data: { key: dto.key } };
  }

  @Get('fraud-signals')
  @ApiOperation({ summary: '[ADMIN] List fraud signals (optionally unresolved only)' })
  async signals(
    @Query('unresolved') unresolved = 'true',
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const where = unresolved === 'true' ? { isResolved: false } : {};
    const take = Number(limit),
      skip = (Number(page) - 1) * take;
    const [items, total] = await Promise.all([
      this.prisma.fraudSignal.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.fraudSignal.count({ where }),
    ]);
    return { success: true, items, total, page: Number(page) };
  }

  @Post('fraud-signals/:id/resolve')
  @ApiOperation({ summary: '[ADMIN] Resolve a fraud signal (recomputes risk score)' })
  async resolve(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    await this.fraud.resolveSignal(id, adminId);
    return { success: true, data: { id, resolved: true } };
  }

  @Get('stats')
  @ApiOperation({ summary: '[ADMIN] Platform-wide counters' })
  async stats() {
    const [users, agencies, vehicles, activeBookings, pendingKyc, openDisputes] = await Promise.all(
      [
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.agency.count({ where: { deletedAt: null, isVerified: true } }),
        this.prisma.vehicle.count({ where: { deletedAt: null } }),
        this.prisma.booking.count({ where: { status: 'ACTIVE' } }),
        this.prisma.kycDocument.count({ where: { status: 'PENDING_REVIEW' } }),
        this.prisma.booking.count({ where: { status: 'DISPUTED' } }),
      ],
    );
    return {
      success: true,
      data: {
        users,
        verifiedAgencies: agencies,
        vehicles,
        activeBookings,
        pendingKyc,
        openDisputes,
      },
    };
  }
}
