import { Body, Controller, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { PaymentsService } from './payments.service';
import { InitiatePaymentDto, RecordCashPaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('booking/:bookingId/initiate')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Client: start CIB/Edahabia payment for a booking' })
  async initiate(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @CurrentUser() caller: AuthenticatedUser,
    @Body() dto: InitiatePaymentDto,
  ) {
    return {
      success: true,
      data: await this.payments.initiateBookingPayment(bookingId, caller, dto.paymentMethod),
    };
  }

  @Post('webhook/confirm')
  @SkipThrottle()
  @ApiOperation({ summary: 'Gateway callback — confirm capture by paymentRef' })
  async confirm(@Query('paymentRef') paymentRef: string) {
    return { success: true, data: await this.payments.confirmBookingPayment(paymentRef) };
  }

  @Post('booking/:bookingId/cash')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENCY_OWNER, UserRole.AGENCY_STAFF)
  @ApiOperation({ summary: 'Agency: record a cash payment' })
  async cash(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @CurrentUser() caller: AuthenticatedUser,
    @Body() dto: RecordCashPaymentDto,
  ) {
    return {
      success: true,
      data: await this.payments.recordCash(bookingId, caller, dto.amountDA, dto.note),
    };
  }
}
