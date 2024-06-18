import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-ioredis';
import { Module } from '@nestjs/common';
import { DefaultCacheService } from './default-cache.service';
import { GenreCacheService } from '../genre/genre-cache.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (
        configService: ConfigService,
      ): Promise<CacheModuleOptions> => ({
        store: redisStore,
        host: configService.get('REDIS_HOST') || 'localhost',
        port: parseInt(configService.get('REDIS_PORT'), 10) || 6379,
        db: 0,
        ttl: parseInt(configService.get('REDIS_TTL'), 10) || 3600,
        connectTimeout: 10000,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: 'DEFAULT_CACHE_MANAGER',
      useClass: GenreCacheService,
    },
    ConfigService,
  ],
  exports: ['DEFAULT_CACHE_MANAGER'],
})
export class DefaultCacheModule {}
