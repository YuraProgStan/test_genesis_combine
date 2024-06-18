import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

@Injectable()
export class DynamoDBService {
  private readonly client: DynamoDBClient;

  constructor(client: DynamoDBClient) {
    this.client = client;
  }

  getClient(): DynamoDBClient {
    return this.client;
  }
}
