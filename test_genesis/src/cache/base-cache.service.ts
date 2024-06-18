import { Injectable, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class CacheService {
  private readonly defaultTTL: number;

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    this.defaultTTL = parseInt(this.configService.get('REDIS_TTL'), 10) || 600;
  }

  async get(key: string): Promise<any> {
    return await this.cacheManager.get(key);
  }

  async set(
    key: string,
    value: any,
    ttl: number = this.defaultTTL,
  ): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }
}
