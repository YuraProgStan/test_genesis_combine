import { Module } from '@nestjs/common';
import { ReviewResolver } from './review.resolver';
import { ReviewService } from './review.service';
import { AuthModule } from '../auth/auth.module';
import { BookStatsService } from './book-stats.service';
import { LoggerModule } from '../logger/logger.module';
import { UserModule } from '../user/user.module';
import { ReviewCacheModule } from '../cache/review/review-cache.module';
import { ReviewRepository } from './review.repository';
import { DynamooseModule } from 'nestjs-dynamoose';
import { ReviewSchema } from './schemas/review.schema';
import { DYNAMO_DB_TABLES } from '../dynamodb/constants';
import { BookStatsSchema } from './schemas/book-stats.schema';
import { BookStatsRepository } from './book-stats.repository';
import { DynamooseConfigService } from '../dynamodb/dynamoose-config.service';

@Module({
  imports: [
    ReviewCacheModule,
    DynamooseModule.forRootAsync({
      useClass: DynamooseConfigService,
    }),
    DynamooseModule.forFeature([
      {
        name: 'Review',
        schema: ReviewSchema,
        options: {
          tableName: DYNAMO_DB_TABLES.REVIEWS,
        },
      },
      {
        name: 'BookStats',
        schema: BookStatsSchema,
        options: {
          tableName: DYNAMO_DB_TABLES.BOOK_STATS,
        },
      },
    ]),
    AuthModule,
    LoggerModule,
    UserModule,
  ],
  providers: [
    ReviewResolver,
    ReviewService,
    BookStatsService,
    ReviewRepository,
    BookStatsRepository,
  ],
  exports: [ReviewService],
})
export class ReviewModule {}
