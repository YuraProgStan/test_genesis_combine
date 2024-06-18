import {
  BatchWriteItemCommand,
  DeleteItemCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { UserActivityLog } from './entities/user-activity.entity';
import { DynamoDBService } from '../dynamodb/dynamodb.service';
import { DYNAMO_DB_TABLES } from '../dynamodb/constants';
import { DeleteActivitiesResponse } from './types/type';
@Injectable()
export class UserActivityLogsService {
  private readonly tableName: string = DYNAMO_DB_TABLES.USER_ACTIVITY_LOGS;

  constructor(private readonly dynamoDBService: DynamoDBService) {}
  async logActivity(
    userId: number,
    activityType: string,
    timestamp: string,
  ): Promise<UserActivityLog> {
    try {
      const activityLog = UserActivityLog.newInstanceFromDTO(
        userId,
        activityType,
        timestamp,
      );

      const itemObject = {
        userId: { N: String(activityLog.userId) },
        activityId: { S: activityLog.activityId },
        activityType: { S: activityLog.activityType },
        timestamp: { N: activityLog.timestamp.getTime().toString() },
      };

      const command = new PutItemCommand({
        TableName: this.tableName,
        Item: itemObject,
      });

      await this.executeCommand(command);

      return activityLog;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to log user activity to DB',
        error.message,
      );
    }
  }
  private async executeCommand(command: any): Promise<any> {
    try {
      return await this.dynamoDBService.getClient().send(command);
    } catch (error) {
      console.error('Error executing command:', error);
      throw new InternalServerErrorException(
        `Failed to execute command: ${error.message}`,
      );
    }
  }
  async getActivityLogs(userId: number): Promise<UserActivityLog[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': { N: userId.toString() },
      },
    });

    const result: UserActivityLog[] = [];
    try {
      const response = await this.dynamoDBService.getClient().send(command);
      for (const item of response.Items) {
        result.push(UserActivityLog.newInstanceFromDynamoDBObject(item));
      }
      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetching user activity by user id from DB',
        error.message,
      );
    }
  }

  async getActivityByType(
    activityType: string,
    timestamp: Date,
  ): Promise<UserActivityLog[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'activityType-timestamp-index', // Assuming you have a secondary index with activityType as the primary key and timestamp as the sort key
      KeyConditionExpression:
        'activityType = :activityType AND #ts > :timestamp',
      ExpressionAttributeNames: {
        '#ts': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':activityType': { S: activityType },
        ':timestamp': { N: timestamp.getTime().toString() },
      },
    });

    const result: UserActivityLog[] = [];
    try {
      const response = await this.executeCommand(command);
      for (const item of response.Items) {
        result.push(UserActivityLog.newInstanceFromDynamoDBObject(item));
      }
      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetching user activity by type from DB',
        error.message,
      );
    }
  }

  async removeActivitiesByTimestampAndType(
    activityType: string,
    timestamp: Date,
  ): Promise<DeleteActivitiesResponse> {
    console.log(activityType);
    console.log(timestamp);
    try {
      const scanCommand = new ScanCommand({
        TableName: this.tableName,
        FilterExpression:
          '#activityType = :activityType AND #timestamp <= :timestamp',
        ExpressionAttributeNames: {
          '#activityType': 'activityType',
          '#timestamp': 'timestamp',
        },
        ExpressionAttributeValues: {
          ':activityType': { S: activityType },
          ':timestamp': { N: timestamp.getTime().toString() },
        },
      });
      console.log('itmes');

      const scanResponse = await this.executeCommand(scanCommand);
      const items = (scanResponse as any).Items;
      if (items.length) {
        console.log(items);

        for (const item of items) {
          const deleteCommand = new DeleteItemCommand({
            TableName: this.tableName,
            Key: {
              YourPrimaryKey: item.YourPrimaryKey,
              YourSortKey: item.YourSortKey,
            },
          });

          await this.executeCommand(deleteCommand);
          return {
            message: `User activities by activityType ${activityType} and < timestamp ${timestamp} have been deleted`,
          };
        }
      } else {
        return {
          message: `User activities by activityType ${activityType} and < timestamp ${timestamp} not exist`,
        };
      }
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to removed user activity by type and timestamp from DB',
        error.message,
      );
    }
  }

  async logActivitiesBulk(activities: UserActivityLog[]): Promise<void> {
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
      console.error('Failed to log user activities to DB:', error);
      throw new InternalServerErrorException(
        'Failed to log user activities to DB',
        error.message,
      );
    }
  }
}
