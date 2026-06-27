import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { KycService } from './kyc.service';
import { KycUploadIntentDto, SubmitKycDocumentDto, RejectKycDto } from './dto/kyc.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('kyc')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('kyc')
export class KycController {
  constructor(private readonly kyc: KycService) {}

  @Post('upload-intent')
  @ApiOperation({ summary: 'Get a presigned PUT URL for a KYC document upload' })
  async uploadIntent(@CurrentUser() user: AuthenticatedUser, @Body() dto: KycUploadIntentDto) {
    return { success: true, data: await this.kyc.createUploadIntent(user.id, dto) };
  }

  @Post('documents')
  @ApiOperation({ summary: 'Register an uploaded KYC document (creates a new version)' })
  async submit(@CurrentUser() user: AuthenticatedUser, @Body() dto: SubmitKycDocumentDto) {
    return { success: true, data: await this.kyc.submitDocument(user.id, dto) };
  }

  @Get('me')
  @ApiOperation({ summary: 'My KYC status (required docs + booking eligibility)' })
  async myStatus(@CurrentUser() user: AuthenticatedUser) {
    return { success: true, data: await this.kyc.getMyStatus(user.id) };
  }

  // ── Admin review workflow ───────────────────────────────────────────────
  @Get('review-queue')
  @UseGuards(RolesGuard) @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Pending KYC documents, oldest first' })
  async queue(@Query('page') page = '1', @Query('limit') limit = '20') {
    return { success: true, ...(await this.kyc.reviewQueue(Number(page), Number(limit))) };
  }

  @Get(':id/download-url')
  @UseGuards(RolesGuard) @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] 5-minute signed URL to view a document' })
  async downloadUrl(@Param('id', ParseUUIDPipe) id: string) {
    return { success: true, data: await this.kyc.getReviewDownloadUrl(id) };
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard) @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Approve a KYC document' })
  async approve(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') adminId: string) {
    return { success: true, data: await this.kyc.approve(id, adminId) };
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard) @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[ADMIN] Reject a KYC document with a reason' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: RejectKycDto,
  ) {
    return { success: true, data: await this.kyc.reject(id, adminId, dto.rejectionReason) };
  }
}
