import { Injectable, OnModuleInit } from '@nestjs/common';
import { DynamoDBService } from './dynamodb.service';
import {
  CreateTableCommand,
  DescribeTableCommand,
  ListTablesCommand,
  CreateTableCommandInput,
  ScalarAttributeType,
} from '@aws-sdk/client-dynamodb';
import { DYNAMO_DB_TABLES } from './constants';

@Injectable()
export class DynamoDBInitializationService implements OnModuleInit {
  constructor(private readonly dynamoDBService: DynamoDBService) {}

  async onModuleInit(): Promise<void> {
    console.log('DynamoDB Initialization Started');
    await this.createTableIfNotExists(
      this.reviewsTableName,
      this.reviewsParams,
    );
    await this.createTableIfNotExists(
      this.userActivitiesLogsTableName,
      this.userActivitiesLogsParams,
    );
    await this.createTableIfNotExists(
      this.bookStatsTableName,
      this.bookStatsParams,
    );
    console.log('DynamoDB Initialization Completed');
  }

  private readonly reviewsTableName: string = DYNAMO_DB_TABLES.REVIEWS;
  private readonly userActivitiesLogsTableName: string =
    DYNAMO_DB_TABLES.USER_ACTIVITY_LOGS;
  private readonly bookStatsTableName: string = DYNAMO_DB_TABLES.BOOK_STATS;

  private readonly reviewsParams: CreateTableCommandInput = {
    TableName: this.reviewsTableName,
    KeySchema: [{ AttributeName: 'reviewId', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'reviewId', AttributeType: ScalarAttributeType.S },
      { AttributeName: 'bookId', AttributeType: ScalarAttributeType.N },
      { AttributeName: 'userId', AttributeType: ScalarAttributeType.N },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    GlobalSecondaryIndexes: [
      {
        IndexName: 'bookId-index',
        KeySchema: [{ AttributeName: 'bookId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
      {
        IndexName: 'userId-index',
        KeySchema: [{ AttributeName: 'userId', KeyType: 'HASH' }],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
  };

  private readonly userActivitiesLogsParams: CreateTableCommandInput = {
    TableName: this.userActivitiesLogsTableName,
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },
      { AttributeName: 'activityId', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: ScalarAttributeType.N },
      { AttributeName: 'activityId', AttributeType: ScalarAttributeType.S },
      { AttributeName: 'activityType', AttributeType: ScalarAttributeType.S },
      { AttributeName: 'timestamp', AttributeType: ScalarAttributeType.N },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    GlobalSecondaryIndexes: [
      {
        IndexName: 'activityType-timestamp-index',
        KeySchema: [
          { AttributeName: 'activityType', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      },
    ],
  };

  private readonly bookStatsParams: CreateTableCommandInput = {
    TableName: this.bookStatsTableName,
    KeySchema: [{ AttributeName: 'bookId', KeyType: 'HASH' }],
    AttributeDefinitions: [
      { AttributeName: 'bookId', AttributeType: ScalarAttributeType.N },
    ],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  };

  private async createTableIfNotExists(
    tableName: string,
    params: CreateTableCommandInput,
  ): Promise<void> {
    try {
      console.log(`Checking if table ${tableName} exists`);
      const { TableNames } = await this.dynamoDBService
        .getClient()
        .send(new ListTablesCommand({}));
      if (!TableNames?.includes(tableName)) {
        const command = new CreateTableCommand(params);
        await this.dynamoDBService.getClient().send(command);
        let retries = 0;
        while (retries < 5) {
          try {
            const { Table } = await this.dynamoDBService
              .getClient()
              .send(new DescribeTableCommand({ TableName: tableName }));
            if (Table?.TableStatus === 'ACTIVE') {
              console.log(`Table ${tableName} is now active.`);
              break;
            }
          } catch (error) {
            if (
              error.name === 'ResourceNotFoundException' ||
              error.name === 'ResourceInUseException'
            ) {
              await new Promise((resolve) => setTimeout(resolve, 5000));
              retries++;
              continue;
            }
            throw error;
          }
        }
      } else {
        console.log(`Table ${tableName} already exists.`);
      }
    } catch (error) {
      console.error(`Error creating ${tableName} table:`, error);
      throw new Error(`Failed to create ${tableName} table: ${error.message}`);
    }
  }
}
