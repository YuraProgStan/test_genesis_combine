import { Module } from '@nestjs/common';
import { UserActivityLogsService } from './user-activities.service';
import { DynamoDBModule } from '../dynamodb/dynamodb.module';

@Module({
  imports: [DynamoDBModule],
  providers: [UserActivityLogsService],
  exports: [UserActivityLogsService],
})
export class UserActivitiesModule {}
