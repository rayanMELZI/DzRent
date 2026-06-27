import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * PlatformConfigService — typed reads of the PlatformConfig table with a
 * 60-second in-memory cache. Seed values (seed.ts) act as code-side defaults
 * so the app degrades gracefully if a key is missing.
 */
@Injectable()
export class PlatformConfigService {
  private readonly logger = new Logger(PlatformConfigService.name);
  private cache = new Map<string, { value: unknown; expiresAt: number }>();
  private static readonly TTL_MS = 60_000;

  constructor(private readonly prisma: PrismaService) {}

  async get<T>(key: string, fallback: T): Promise<T> {
    const hit = this.cache.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.value as T;
    try {
      const row = await this.prisma.platformConfig.findUnique({ where: { key } });
      const value = (row?.value ?? fallback) as T;
      this.cache.set(key, { value, expiresAt: Date.now() + PlatformConfigService.TTL_MS });
      return value;
    } catch (e) {
      this.logger.warn(`Config read failed for "${key}" — using fallback. ${(e as Error).message}`);
      return fallback;
    }
  }

  async set(key: string, value: unknown, updatedBy: string): Promise<void> {
    await this.prisma.platformConfig.upsert({
      where: { key },
      create: { key, value: value as never, updatedBy },
      update: { value: value as never, updatedBy },
    });
    this.cache.delete(key);
  }

  async getAll(): Promise<{ key: string; value: unknown; description: string | null }[]> {
    return this.prisma.platformConfig.findMany({ orderBy: { key: 'asc' } });
  }
}
