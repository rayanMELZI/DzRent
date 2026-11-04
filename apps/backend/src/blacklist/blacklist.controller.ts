import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { BlacklistService } from './blacklist.service';
import { AdminReviewBlacklistDto, CreateBlacklistDto } from './dto/blacklist.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('blacklist')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('blacklist')
export class BlacklistController {
  constructor(private readonly blacklist: BlacklistService) {}

  @Post()
  @Roles(UserRole.AGENCY_OWNER, UserRole.AGENCY_STAFF)
  async create(@CurrentUser() caller: AuthenticatedUser, @Body() dto: CreateBlacklistDto) {
    return { success: true, data: await this.blacklist.create(caller, dto) };
  }

  @Get()
  @Roles(UserRole.AGENCY_OWNER, UserRole.AGENCY_STAFF)
  async mine(
    @CurrentUser() caller: AuthenticatedUser,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return {
      success: true,
      ...(await this.blacklist.listMine(caller, Number(page), Number(limit))),
    };
  }

  @Get('visible')
  @Roles(UserRole.AGENCY_OWNER, UserRole.AGENCY_STAFF)
  async visible(
    @CurrentUser() caller: AuthenticatedUser,
    @Query('q') q?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return {
      success: true,
      ...(await this.blacklist.listVisible(
        caller,
        q?.trim() || undefined,
        Number(page) || 1,
        Math.min(Number(limit) || 50, 100),
      )),
    };
  }

  @Get('all')
  @Roles(UserRole.ADMIN)
  async all(@Query('page') page = '1', @Query('limit') limit = '20') {
    return { success: true, ...(await this.blacklist.adminList(Number(page), Number(limit))) };
  }

  @Get('check/:userId')
  @Roles(UserRole.AGENCY_OWNER, UserRole.AGENCY_STAFF)
  async check(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() caller: AuthenticatedUser,
  ) {
    return { success: true, data: await this.blacklist.check(userId, caller) };
  }

  @Delete(':id')
  @Roles(UserRole.AGENCY_OWNER, UserRole.AGENCY_STAFF)
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthenticatedUser,
  ) {
    return { success: true, data: await this.blacklist.deactivate(id, caller) };
  }

  @Post(':id/review')
  @Roles(UserRole.ADMIN)
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: AdminReviewBlacklistDto,
  ) {
    return { success: true, data: await this.blacklist.adminReview(id, adminId, dto) };
  }
}
