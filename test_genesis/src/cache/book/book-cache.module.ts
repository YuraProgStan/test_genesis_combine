import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-ioredis';
import { CacheModule } from '@nestjs/cache-manager';
import { BookCacheService } from './book-cache.service';
import { GenreCacheService } from '../genre/genre-cache.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          store: redisStore,
          host: configService.get('REDIS_HOST') || 'localhost',
          port: parseInt(configService.get('REDIS_PORT'), 10) || 6379,
          db: 1,
          ttl: parseInt(configService.get('REDIS_TTL'), 10) || 3600,
          connectTimeout: 10000,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: 'BOOK_CACHE_MANAGER',
      useClass: BookCacheService,
    },
    ConfigService,
  ],
  exports: ['BOOK_CACHE_MANAGER'],
})
export class BookCacheModule {}
