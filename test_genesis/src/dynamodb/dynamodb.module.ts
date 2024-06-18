import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DynamoDBService } from './dynamodb.service';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { UserActivityLogsService } from '../user-activities/user-activities.service';
import { DynamoDBInitializationService } from './dynamoDBInitialization.service';
import { BookStatsService } from '../review/book-stats.service';
import { ReviewService } from '../review/review.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [
    {
      provide: DynamoDBClient,
      useFactory: (configService: ConfigService) => {
        return new DynamoDBClient({
          region: configService.get('AWS_REGION'),
          credentials: {
            accessKeyId: configService.get('AWS_ACCESS_KEY_ID'),
            secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY'),
          },
          endpoint: configService.get('DYNAMODB_ENDPOINT'),
        });
      },
      inject: [ConfigService],
    },
    DynamoDBService,
    DynamoDBInitializationService,
    ReviewService,
    BookStatsService,
    UserActivityLogsService,
  ],
  exports: [DynamoDBService, BookStatsService],
})
export class DynamoDBModule {}
