import { Module } from '@nestjs/common';
import { UserActivityLogsService } from './user-activities.service';
import { DynamooseModule } from 'nestjs-dynamoose';
import { UserActivityLogSchema } from "./schemas/user-activity.schema";
import { DYNAMO_DB_TABLES } from '../dynamodb/constants';
import {UserActivitiesRepository} from "./user-activities.repository";
import {DynamooseConfigService} from "../dynamodb/dynamoose-config.service";


@Module({
  imports: [
      DynamooseModule.forRootAsync({
          useClass: DynamooseConfigService,
      }),
      DynamooseModule.forFeature([
      {
          name: 'UserActivity',
          schema: UserActivityLogSchema,
          options: {
              tableName: DYNAMO_DB_TABLES.USER_ACTIVITY_LOGS,
          },
      },
  ]),],
  providers: [UserActivityLogsService, UserActivitiesRepository],
  exports: [UserActivityLogsService],
})
export class UserActivitiesModule {}
