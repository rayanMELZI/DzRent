import { Controller, Get } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liveness + dependency checks (DB, Redis)' })
  async check() {
    const result: Record<string, string> = { status: 'ok' };
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      result.database = 'up';
    } catch {
      result.database = 'down';
      result.status = 'degraded';
    }
    try {
      const pong = await this.redis.ping();
      result.redis = pong === 'PONG' ? 'up' : 'down';
    } catch {
      result.redis = 'down';
      result.status = 'degraded';
    }
    return {
      success: result.status === 'ok',
      data: { ...result, timestamp: new Date().toISOString() },
    };
  }
}
