import {
  BatchWriteItemCommand,
} from '@aws-sdk/client-dynamodb';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { UserActivityLog } from './entities/user-activity.entity';
import { DynamoDBService } from '../dynamodb/dynamodb.service';
import { DYNAMO_DB_TABLES } from '../dynamodb/constants';
@Injectable()
export class UserActivityLogsService {
  private readonly tableName: string = DYNAMO_DB_TABLES.USER_ACTIVITY_LOGS;

  constructor(private readonly dynamoDBService: DynamoDBService) {}

  async logActivitiesBulk(activities: UserActivityLog[]): Promise<void> {
    console.log('logActivitiesBulk');
    console.log(activities);

    try {
      const items = activities.map((activity: UserActivityLog) => {
        const { userId, activityType, timestamp } = activity;
        const activityLog = UserActivityLog.newInstanceFromDTO(
          userId,
          activityType,
          timestamp.toString(),
        );
        return {
          PutRequest: {
            Item: {
              activityId: { S: activityLog.activityId },
              userId: { N: String(activityLog.userId) },
              activityType: { S: activityLog.activityType },
              timestamp: {
                N: String(new Date(activityLog.timestamp).getTime()),
              },
            },
          },
        };
      });

      const requestItems = {
        [this.tableName]: items,
      };

      const command = new BatchWriteItemCommand({
        RequestItems: requestItems,
      });

      await this.dynamoDBService.getClient().send(command);
    } catch (error) {
        if (error instanceof Error) {
            console.error('Failed to log user activities to DB:', error);
            throw new InternalServerErrorException(
                'Failed to log user activities to DB',
                error.message,  // Accessing 'message' property safely
            );
        } else {
            // Handle cases where error is not an instance of Error
            console.error('Failed to log user activities to DB:', error);
            throw new InternalServerErrorException(
                'Failed to log user activities to DB',
                'Unknown error occurred',  // Provide a fallback message
            );
        }
    }
  }
}
