import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { UsersService } from './users.service';
import {
  UpdateProfileDto,
  UserResponseDto,
  AdminUserResponseDto,
  ListUsersQueryDto,
} from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── GET /users/me ─────────────────────────────────────────────────────────

  @Get('me')
  @ApiOperation({
    summary: "Get the authenticated user's own profile",
    description: 'Returns profile data including KYC document status summary.',
  })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async getMyProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: true; data: UserResponseDto }> {
    const data = await this.usersService.getProfile(user.id);
    return { success: true, data };
  }

  // ── PATCH /users/me ───────────────────────────────────────────────────────

  @Patch('me')
  @ApiOperation({
    summary: "Update the authenticated user's profile",
    description:
      'Updatable fields: firstName, lastName, email, locale, avatarUrl. ' +
      'Phone number changes require a separate OTP verification flow. ' +
      'nationalIdNumber is managed exclusively by the KYC module.',
  })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email already in use.' })
  async updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<{ success: true; data: UserResponseDto }> {
    const data = await this.usersService.updateProfile(user.id, dto);
    return { success: true, data };
  }

  // ── DELETE /users/me ──────────────────────────────────────────────────────

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request account deletion (GDPR erasure)',
    description:
      'Soft-deletes the account. Full PII anonymisation runs in a background job. ' +
      'Active rentals must be completed before deletion.',
  })
  @ApiResponse({ status: 200, description: 'Deletion scheduled.' })
  @ApiResponse({ status: 400, description: 'Active bookings prevent deletion.' })
  async deleteMyAccount(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: true; message: string }> {
    return { success: true, ...(await this.usersService.deleteOwnAccount(user.id)) };
  }

  // ── GET /users — Admin only ───────────────────────────────────────────────

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: '[ADMIN] List all users with pagination',
    description: 'Restricted to ADMIN role. Supports filtering by role and status.',
  })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async listUsers(
    @CurrentUser() caller: AuthenticatedUser,
    @Query() query: ListUsersQueryDto,
  ): Promise<{ success: true; data: UserResponseDto[]; total: number; page: number }> {
    const result = await this.usersService.listUsers(caller, {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      role: query.role as UserRole | undefined,
      status: query.status,
    });
    return { success: true, ...result };
  }

  // ── GET /users/:id — Admin or own profile ────────────────────────────────

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: '[ADMIN] Get any user by UUID',
    description:
      'Returns the full user record including risk fields and agency relationships. ' +
      'ADMIN receives AdminUserResponseDto; users requesting their own profile ' +
      'receive the standard UserResponseDto.',
  })
  @ApiParam({ name: 'id', description: 'User UUID', format: 'uuid' })
  @ApiResponse({ status: 200, type: AdminUserResponseDto })
  @ApiResponse({ status: 403, description: 'Insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getUserById(
    @Param('id', ParseUUIDPipe) targetId: string,
    @CurrentUser() caller: AuthenticatedUser,
  ): Promise<{ success: true; data: UserResponseDto | AdminUserResponseDto }> {
    const data = await this.usersService.getUserById(targetId, caller);
    return { success: true, data };
  }
}
