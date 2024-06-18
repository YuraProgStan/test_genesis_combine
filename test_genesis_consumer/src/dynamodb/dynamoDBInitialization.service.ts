import {Injectable, OnModuleInit} from '@nestjs/common';
import { DynamoDBService } from './dynamodb.service';
import {
  CreateTableCommand,
  CreateTableCommandInput,
  DescribeTableCommand,
  ListTablesCommand,
  ScalarAttributeType,
} from '@aws-sdk/client-dynamodb';
import { DYNAMO_DB_TABLES } from './constants';

@Injectable()
export class DynamoDBInitializationService implements OnModuleInit {
  constructor(private readonly dynamoDBService: DynamoDBService) {}

  async onModuleInit(): Promise<void> {
    await this.createTableIfNotExists(this.tableName1, this.tableParams1);
    await this.createTableIfNotExists(this.tableName2, this.tableParams2);
  }

  private readonly tableName1: string = DYNAMO_DB_TABLES.REVIEWS;
  private readonly tableName2: string = DYNAMO_DB_TABLES.USER_ACTIVITY_LOGS;

  private readonly tableParams1: CreateTableCommandInput = {
    TableName: this.tableName1,
    KeySchema: [
      { AttributeName: 'reviewId', KeyType: 'HASH' }, // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'reviewId', AttributeType: ScalarAttributeType.S },
      { AttributeName: 'bookId', AttributeType: ScalarAttributeType.N },
      { AttributeName: 'userId', AttributeType: ScalarAttributeType.N },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
    GlobalSecondaryIndexes: [
      {
        IndexName: 'bookId-index',
        KeySchema: [
          { AttributeName: 'bookId', KeyType: 'HASH' }, // GSI partition key
        ],
        Projection: {
          ProjectionType: 'ALL', // Adjust projection type as needed
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
      {
        IndexName: 'userId-index', // New index
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' }, // GSI partition key
        ],
        Projection: {
          ProjectionType: 'ALL', // Adjust projection type as needed
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
  };

  private readonly tableParams2: CreateTableCommandInput = {
    TableName: this.tableName2,
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },
      { AttributeName: 'activityId', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: ScalarAttributeType.N },
      {
        AttributeName: 'activityId',
        AttributeType: ScalarAttributeType.S,
      },
      {
        AttributeName: 'activityType',
        AttributeType: ScalarAttributeType.S,
      },
      {
        AttributeName: 'timestamp',
        AttributeType: ScalarAttributeType.N,
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
    GlobalSecondaryIndexes: [
      {
        IndexName: 'activityType-timestamp-index',
        KeySchema: [
          { AttributeName: 'activityType', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
  };
  async createTableIfNotExists(
    tableName: string,
    params: CreateTableCommandInput,
  ): Promise<void> {
    try {
      // List all tables in DynamoDB
      const { TableNames } = await this.dynamoDBService
        .getClient()
        .send(new ListTablesCommand({}));

      if (!TableNames?.includes(tableName)) {
        const command = new CreateTableCommand(params);
        // Create the table
        await this.dynamoDBService.getClient().send(command);
        let retries = 0;
        while (retries < 5) {
          try {
            const { Table } = await this.dynamoDBService.getClient().send(
              new DescribeTableCommand({
                TableName: tableName,
              }),
            );

            if (Table?.TableStatus === 'ACTIVE') {
              break;
            }
          } catch (error) {
              if (error instanceof Error && (error as any).name) {
                  if (
                      (error as any).name === 'ResourceNotFoundException' ||
                      (error as any).name === 'ResourceInUseException'
                  ) {
                      await new Promise((resolve) => setTimeout(resolve, 5000));
                      retries++;
                      continue;
                  }
              }
              throw error;
          }
        }
      }
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Error creating ${tableName} table:`, error);
            throw new Error(`Failed to create ${tableName} table: ${error.message}`);
        } else {
            console.error(`Error creating ${tableName} table:`, error);
            throw new Error(`Failed to create ${tableName} table: Unknown error`);
        }
    }
  }
}
