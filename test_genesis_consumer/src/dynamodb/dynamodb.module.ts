import { Module } from '@nestjs/common';
import { DynamoDBService } from './dynamodb.service';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { UserActivityLogsService } from '../user-activities/user-activities.service';
import { DynamoDBInitializationService } from './dynamoDBInitialization.service';

@Module({
  providers: [
    DynamoDBService,
    DynamoDBClient,
    DynamoDBInitializationService,
    UserActivityLogsService,
  ],
  exports: [DynamoDBService],
})
export class DynamoDBModule {}
