import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  DeleteActivitiesResponse,
  UserActivityLogTransform,
} from './types/type';
import { UserActivitiesRepository } from './user-activities.repository';
import { UserActivityLog } from './schemas/user-activity.schema';
import { ActivityType } from './enums/enums';

@Injectable()
export class UserActivityLogsService {
  constructor(
    private readonly userActivitiesRepository: UserActivitiesRepository,
  ) {}

  async getActivityLogs(userId: number): Promise<UserActivityLogTransform[]> {
    try {
      const userActivities: UserActivityLog[] =
        await this.userActivitiesRepository.findUserActivitiesByUserId(userId);
      const userActivitiesTransform: UserActivityLogTransform[] =
        userActivities.map((userActivity) =>
          UserActivityLog.newInstanceFromDynamoDBDormObject(userActivity),
        );
      return userActivitiesTransform;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetching user activity by user id from DB',
        error.message,
      );
    }
  }

  async getActivityByType(
    activityType: ActivityType,
    timestamp: Date,
  ): Promise<UserActivityLogTransform[]> {
    try {
      const inputTimestampMillis = new Date(timestamp).getTime();
      const userActivities =
        await this.userActivitiesRepository.getActivityByType(
          activityType,
          inputTimestampMillis,
        );
      const userActivitiesTransform = userActivities.map((userActivity) =>
        UserActivityLog.newInstanceFromDynamoDBDormObject(userActivity),
      );
      return userActivitiesTransform;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetching user activity by type from DB',
        error.message,
      );
    }
  }

  async removeActivitiesByTimestampAndType(
    activityType: ActivityType,
    timestamp: Date,
  ): Promise<DeleteActivitiesResponse> {
    const timestampMiles = timestamp.getTime();
    try {
      const operation =
        await this.userActivitiesRepository.removeActivitiesByTimestampAndType(
          activityType,
          timestampMiles,
        );
      if (operation.success) {
        return {
          message: `User activities by activityType ${activityType} and < timestamp ${timestamp} have been deleted`,
        };
      }
      return {
        message: `User activities by activityType ${activityType} and < timestamp ${timestamp} not exist`,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to removed user activity by type and timestamp from DB',
        error.message,
      );
    }
  }

  // async logActivitiesBulk(activities: UserActivityLog[]): Promise<void> {
  //   try {
  //     const items = activities.map((activity: UserActivityLog) => {
  //       const { userId, activityType, timestamp } = activity;
  //       const activityLog = UserActivityLog.newInstanceFromDTO(
  //         userId,
  //         activityType,
  //         timestamp.toString(),
  //       );
  //       return {
  //         PutRequest: {
  //           Item: {
  //             activityId: { S: activityLog.activityId },
  //             userId: { N: String(activityLog.userId) },
  //             activityType: { S: activityLog.activityType },
  //             timestamp: {
  //               N: String(new Date(activityLog.timestamp).getTime()),
  //             },
  //           },
  //         },
  //       };
  //     });
  //
  //     const requestItems = {
  //       [this.tableName]: items,
  //     };
  //
  //     const command = new BatchWriteItemCommand({
  //       RequestItems: requestItems,
  //     });
  //
  //     await this.dynamoDBService.getClient().send(command);
  //   } catch (error) {
  //     console.error('Failed to log user activities to DB:', error);
  //     throw new InternalServerErrorException(
  //       'Failed to log user activities to DB',
  //       error.message,
  //     );
  //   }
  // }
}
