import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'My notification center (items + unread count)' })
  async mine(@CurrentUser('id') userId: string, @Query('page') page = '1', @Query('limit') limit = '20') {
    const take = Math.min(Math.max(Number(limit) || 20, 1), 50);
    return { success: true, data: await this.notifications.listMine(userId, Number(page) || 1, take) };
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  async readAll(@CurrentUser('id') userId: string) {
    return { success: true, data: await this.notifications.markAllRead(userId) };
  }
}
