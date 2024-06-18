import { forwardRef, Module } from '@nestjs/common';
import { UserActivityLogsResolver } from './user-activities.resolver';
import { UserActivityLogsService } from './user-activities.service';
import { DynamoDBModule } from '../dynamodb/dynamodb.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [DynamoDBModule, forwardRef(() => UserModule)],
  providers: [UserActivityLogsResolver, UserActivityLogsService],
  exports: [UserActivityLogsService],
})
export class UserActivitiesModule {}
