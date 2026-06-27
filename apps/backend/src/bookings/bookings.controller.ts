import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BookingStatus, UserRole } from '@prisma/client';

import { BookingsService } from './bookings.service';
import { CreateBookingDto, PickupDto, RejectBookingDto, ReturnDto } from './dto/booking.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

const AGENCY = [UserRole.AGENCY_OWNER, UserRole.AGENCY_STAFF] as const;

@ApiTags('bookings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post() @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Client: create a booking (runs all eligibility gates)' })
  async create(@CurrentUser() caller: AuthenticatedUser, @Body() dto: CreateBookingDto) {
    return { success: true, data: await this.bookings.create(caller, dto) };
  }

  @Get('me') @Roles(UserRole.CLIENT)
  async mine(@CurrentUser() caller: AuthenticatedUser, @Query('page') page = '1', @Query('limit') limit = '20') {
    return { success: true, ...(await this.bookings.listMine(caller, Number(page), Number(limit))) };
  }

  @Get('agency') @Roles(...AGENCY)
  async agency(@CurrentUser() caller: AuthenticatedUser, @Query('status') status?: BookingStatus, @Query('page') page = '1', @Query('limit') limit = '20') {
    return { success: true, ...(await this.bookings.listForAgency(caller, status, Number(page), Number(limit))) };
  }

  @Get(':id')
  async byId(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() caller: AuthenticatedUser) {
    return { success: true, data: await this.bookings.getById(id, caller) };
  }

  @Post(':id/cancel') @Roles(UserRole.CLIENT)
  async cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() caller: AuthenticatedUser) {
    return { success: true, data: await this.bookings.cancel(id, caller) };
  }

  @Post(':id/approve') @Roles(...AGENCY)
  async approve(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() caller: AuthenticatedUser) {
    return { success: true, data: await this.bookings.approve(id, caller) };
  }

  @Post(':id/reject') @Roles(...AGENCY)
  async reject(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() caller: AuthenticatedUser, @Body() dto: RejectBookingDto) {
    return { success: true, data: await this.bookings.reject(id, caller, dto.reason) };
  }

  @Post(':id/pickup') @Roles(...AGENCY)
  async pickup(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() caller: AuthenticatedUser, @Body() dto: PickupDto) {
    return { success: true, data: await this.bookings.pickup(id, caller, dto) };
  }

  @Post(':id/return') @Roles(...AGENCY)
  async ret(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() caller: AuthenticatedUser, @Body() dto: ReturnDto) {
    return { success: true, data: await this.bookings.return(id, caller, dto) };
  }
}
