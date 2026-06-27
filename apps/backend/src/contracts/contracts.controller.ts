import { Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('contracts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contracts: ContractsService) {}

  @Get('booking/:bookingId')
  async forBooking(@Param('bookingId', ParseUUIDPipe) bookingId: string, @CurrentUser() caller: AuthenticatedUser) {
    return { success: true, data: await this.contracts.getForBooking(bookingId, caller) };
  }

  @Post('booking/:bookingId/sign')
  async sign(@Param('bookingId', ParseUUIDPipe) bookingId: string, @CurrentUser() caller: AuthenticatedUser, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip ?? 'unknown';
    return { success: true, data: await this.contracts.clientSign(bookingId, caller, ip) };
  }

  @Post('booking/:bookingId/agency-sign')
  async agencySign(@Param('bookingId', ParseUUIDPipe) bookingId: string, @CurrentUser() caller: AuthenticatedUser) {
    return { success: true, data: await this.contracts.agencySign(bookingId, caller) };
  }
}
