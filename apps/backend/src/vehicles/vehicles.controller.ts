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
import { UserRole, VehicleStatus } from '@prisma/client';

import { VehiclesService } from './vehicles.service';
import {
  AddInsuranceDto,
  AddVehiclePhotoDto,
  CreateVehicleDto,
  SearchVehiclesDto,
  SetVehicleStatusDto,
  SubmitVehicleDocDto,
  UpdateVehicleDto,
  VehicleDocIntentDto,
  VehiclePhotoIntentDto,
} from './dto/vehicle.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

const AGENCY = [UserRole.AGENCY_OWNER, UserRole.AGENCY_STAFF] as const;

@ApiTags('vehicles')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Client search: available, compliant vehicles in a wilaya for a period',
  })
  async search(@Query() q: SearchVehiclesDto) {
    return { success: true, ...(await this.vehicles.search(q)) };
  }

  @Post()
  @Roles(...AGENCY)
  async create(@CurrentUser() caller: AuthenticatedUser, @Body() dto: CreateVehicleDto) {
    return { success: true, data: await this.vehicles.create(caller, dto) };
  }

  @Get()
  @Roles(...AGENCY)
  async list(
    @CurrentUser() caller: AuthenticatedUser,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: VehicleStatus,
  ) {
    return {
      success: true,
      ...(await this.vehicles.list(caller, Number(page), Number(limit), status)),
    };
  }

  @Get(':id')
  @Roles(...AGENCY)
  async byId(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() caller: AuthenticatedUser) {
    return { success: true, data: await this.vehicles.getById(id, caller) };
  }

  @Patch(':id')
  @Roles(...AGENCY)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthenticatedUser,
    @Body() dto: UpdateVehicleDto,
  ) {
    return { success: true, data: await this.vehicles.update(id, caller, dto) };
  }

  @Delete(':id')
  @Roles(UserRole.AGENCY_OWNER)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() caller: AuthenticatedUser) {
    return { success: true, data: await this.vehicles.softDelete(id, caller) };
  }

  @Post(':id/status')
  @Roles(...AGENCY)
  async setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthenticatedUser,
    @Body() dto: SetVehicleStatusDto,
  ) {
    return { success: true, data: await this.vehicles.setStatus(id, caller, dto) };
  }

  @Post(':id/photos/upload-intent')
  @Roles(...AGENCY)
  async photoIntent(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthenticatedUser,
    @Body() dto: VehiclePhotoIntentDto,
  ) {
    return { success: true, data: await this.vehicles.photoIntent(id, caller, dto) };
  }

  @Post(':id/photos')
  @Roles(...AGENCY)
  async addPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthenticatedUser,
    @Body() dto: AddVehiclePhotoDto,
  ) {
    return { success: true, data: await this.vehicles.addPhoto(id, caller, dto) };
  }

  @Post(':id/documents/upload-intent')
  @Roles(...AGENCY)
  async docIntent(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthenticatedUser,
    @Body() dto: VehicleDocIntentDto,
  ) {
    return { success: true, data: await this.vehicles.docIntent(id, caller, dto) };
  }

  @Post(':id/documents')
  @Roles(...AGENCY)
  async submitDoc(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthenticatedUser,
    @Body() dto: SubmitVehicleDocDto,
  ) {
    return { success: true, data: await this.vehicles.submitDoc(id, caller, dto) };
  }

  @Post(':id/insurance')
  @Roles(...AGENCY)
  async addInsurance(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthenticatedUser,
    @Body() dto: AddInsuranceDto,
  ) {
    return { success: true, data: await this.vehicles.addInsurance(id, caller, dto) };
  }
}
