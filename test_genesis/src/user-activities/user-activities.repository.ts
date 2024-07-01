import { Injectable } from '@nestjs/common';
import { InjectModel, Model } from 'nestjs-dynamoose';
import {
  UserActivityLog,
  UserActivityLogKey,
} from './schemas/user-activity.schema';
import { SortOrder } from 'dynamoose/dist/General';
import { ActivityType } from './enums/enums';
import { ApolloError } from 'apollo-server-express';

@Injectable()
export class UserActivitiesRepository {
  constructor(
    @InjectModel('UserActivity')
    private userActivityLogModel: Model<UserActivityLog, UserActivityLogKey>,
  ) {}

  async findUserActivitiesByUserId(userId: number): Promise<UserActivityLog[]> {
    const result = await this.userActivityLogModel
      .query('userId')
      .eq(userId)
      .using('GSI1')
      .sort(SortOrder.descending)
      .limit(10)
      .exec();

    if (!result || result.length === 0) {
      return [];
    }

    return result;
  }

  async getActivityByType(
    activityType: ActivityType,
    inputTimestamp: number,
  ): Promise<UserActivityLog[]> {
    const result = await this.userActivityLogModel
      .query('activityType')
      .eq(activityType)
      .using('GSI2') // Ensure this matches the correct index name
      .where('timestamp')
      .gt(inputTimestamp)
      .sort(SortOrder.descending)
      .limit(20)
      .exec();

    if (!result || result.length === 0) {
      return [];
    }

    return result;
  }

  async removeActivitiesByTimestampAndType(
    activityType: string,
    inputTimestamp: number,
  ): Promise<{ success: boolean }> {
    const sizeBatch = 25;

    while (true) {
      const query = await this.userActivityLogModel
        .query('activityType')
        .eq(activityType)
        .where('timestamp')
        .lt(inputTimestamp)
        .limit(sizeBatch)
        .exec();

      const { lastKey } = query;

      const items = query as UserActivityLog[];

      if (items.length === 0) {
        break;
      }
      const activityIds: { activityId: string; timestamp: number }[] =
        items.map((item) => ({
          activityId: item.activityId,
          timestamp: item.timestamp,
        }));

      try {
        await this.userActivityLogModel.batchDelete(activityIds);
      } catch (error) {
        console.error('Failed to delete activities:', error.stack);
        throw new ApolloError(
          'Failed to remove activities by timestamp and type',
          'INTERNAL_SERVER_ERROR',
        );
      }
      if (!lastKey || !lastKey.timestamp) {
        break;
      }

      inputTimestamp = lastKey.timestamp;
    }

    return { success: true };
  }
}
