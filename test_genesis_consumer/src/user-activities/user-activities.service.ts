import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DYNAMO_DB_TABLES } from '../dynamodb/constants';
import { UserActivitiesRepository } from './user-activities.repository';
import { UserActivityLog } from './schemas/user-activity.schema';
@Injectable()
export class UserActivityLogsService {
  private readonly tableName: string = DYNAMO_DB_TABLES.USER_ACTIVITY_LOGS;

  constructor(
      private readonly userActivitiesRepository: UserActivitiesRepository,
  ) {}

  async logActivitiesBulk(activities: UserActivityLog[]): Promise<void> {

    try {
      const items = activities.map((activity: UserActivityLog) => {
        const { userId, activityType, timestamp } = activity;
        const activityLog: UserActivityLog = UserActivityLog.newInstanceFromDTO(
          userId,
          activityType,
          timestamp.toString(),
        );
      return activityLog;
      });

      await this.userActivitiesRepository.logActivitiesBulk(items);
    } catch (error) {
            throw new InternalServerErrorException(
                'Failed to log user activities to DB',
                'Unknown error occurred',
            );
        }
  }
}
