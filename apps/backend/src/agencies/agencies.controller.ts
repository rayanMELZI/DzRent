import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { AgenciesService } from './agencies.service';
import {
  AddStaffDto,
  AgencyUploadIntentDto,
  CreateAgencyDto,
  SubmitAgencyDocumentDto,
  UpdateAgencyDto,
  VerifyAgencyDto,
} from './dto/agency.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('agencies')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('agencies')
export class AgenciesController {
  constructor(private readonly agencies: AgenciesService) {}

  @Post()
  @ApiOperation({ summary: 'Create an agency (promotes CLIENT → AGENCY_OWNER)' })
  async create(@CurrentUser() caller: AuthenticatedUser, @Body() dto: CreateAgencyDto) {
    return { success: true, data: await this.agencies.create(caller, dto) };
  }

  @Get('me')
  @ApiOperation({ summary: 'My agencies (owner) or my agency (staff)' })
  async mine(@CurrentUser() caller: AuthenticatedUser) {
    return { success: true, data: await this.agencies.getMine(caller) };
  }

  @Get('pending-verification')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Agencies awaiting verification' })
  async pending(@Query('page') page = '1', @Query('limit') limit = '20') {
    return {
      success: true,
      ...(await this.agencies.pendingVerification(Number(page), Number(limit))),
    };
  }

  @Get(':id')
  async byId(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() caller: AuthenticatedUser) {
    return { success: true, data: await this.agencies.getById(id, caller) };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthenticatedUser,
    @Body() dto: UpdateAgencyDto,
  ) {
    return { success: true, data: await this.agencies.update(id, caller, dto) };
  }

  @Post(':id/documents/upload-intent')
  async docIntent(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthenticatedUser,
    @Body() dto: AgencyUploadIntentDto,
  ) {
    return { success: true, data: await this.agencies.uploadIntent(id, caller, dto) };
  }

  @Post(':id/documents')
  async submitDoc(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthenticatedUser,
    @Body() dto: SubmitAgencyDocumentDto,
  ) {
    return { success: true, data: await this.agencies.submitDocument(id, caller, dto) };
  }

  @Post(':id/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Approve or reject agency verification' })
  async verify(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: VerifyAgencyDto,
  ) {
    return { success: true, data: await this.agencies.verify(id, adminId, dto) };
  }

  @Post(':id/staff')
  async addStaff(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthenticatedUser,
    @Body() dto: AddStaffDto,
  ) {
    return { success: true, data: await this.agencies.addStaff(id, caller, dto) };
  }

  @Get(':id/staff')
  async listStaff(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthenticatedUser,
  ) {
    return { success: true, data: await this.agencies.listStaff(id, caller) };
  }

  @Delete(':id/staff/:staffId')
  async removeStaff(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @CurrentUser() caller: AuthenticatedUser,
  ) {
    return { success: true, data: await this.agencies.removeStaff(id, staffId, caller) };
  }
}
