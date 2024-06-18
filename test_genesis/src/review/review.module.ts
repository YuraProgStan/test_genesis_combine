import { Module } from '@nestjs/common';
import { ReviewResolver } from './review.resolver';
import { ReviewService } from './review.service';
import { DynamoDBModule } from '../dynamodb/dynamodb.module';
import { AuthModule } from '../auth/auth.module';
import { BookStatsService } from './book-stats.service';
import { LoggerModule } from '../logger/logger.module';
import { UserModule } from '../user/user.module';
import { ReviewCacheModule } from '../cache/review/review-cache.module';

@Module({
  imports: [
    ReviewCacheModule,
    DynamoDBModule,
    AuthModule,
    LoggerModule,
    UserModule,
  ],
  providers: [ReviewResolver, ReviewService, BookStatsService],
  exports: [ReviewService],
})
export class ReviewModule {}
