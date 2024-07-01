import { forwardRef, Module } from '@nestjs/common';
import { UserActivityLogsResolver } from './user-activities.resolver';
import { UserActivityLogsService } from './user-activities.service';
import { UserModule } from '../user/user.module';
import { UserActivitiesRepository } from './user-activities.repository';
import { DynamooseModule } from 'nestjs-dynamoose';
import { DYNAMO_DB_TABLES } from '../dynamodb/constants';
import { UserActivityLogSchema } from './schemas/user-activity.schema';
import {AuthModule} from "../auth/auth.module";
@Module({
  imports: [
    DynamooseModule.forFeature([
      {
        name: 'UserActivity',
        schema: UserActivityLogSchema,
        options: {
          tableName: DYNAMO_DB_TABLES.USER_ACTIVITY_LOGS,
        },
      },
    ]),
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
  ],
  providers: [
    UserActivityLogsResolver,
    UserActivityLogsService,
    UserActivitiesRepository,
  ],
  exports: [UserActivityLogsService],
})
export class UserActivitiesModule {}
