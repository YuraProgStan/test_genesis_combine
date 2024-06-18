import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { DYNAMO_DB_TABLES } from '../dynamodb/constants';
import { DynamoDBService } from '../dynamodb/dynamodb.service';

@Injectable()
export class BookStatsService {
  private readonly tableName: string = DYNAMO_DB_TABLES.BOOK_STATS;

  constructor(private readonly dynamoDBService: DynamoDBService) {}

  async findByBookId(
    bookId: number,
  ): Promise<{ totalVotes: number; meanRating: number }> {
    try {
      const command = new GetItemCommand({
        TableName: this.tableName,
        Key: { bookId: { N: String(bookId) } },
      });

      const response = await this.dynamoDBService.getClient().send(command);

      if (!response.Item) {
        return {
          totalVotes: 0,
          meanRating: 0,
        };
      }

      return {
        totalVotes: Number(response.Item.totalVotes.N),
        meanRating: Number(Number(response.Item.meanRating.N).toFixed(2)),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to find book stats by book ID',
        error.message,
      );
    }
  }

  async updateByBookId(
    bookId: number,
    stats: { totalVotes: number; meanRating: number },
  ): Promise<void> {
    try {
      const command = new UpdateItemCommand({
        TableName: this.tableName,
        Key: { bookId: { N: String(bookId) } },
        UpdateExpression: 'set totalVotes = :v, meanRating = :r',
        ExpressionAttributeValues: {
          ':v': { N: String(stats.totalVotes) },
          ':r': { N: String(stats.meanRating) },
        },
      });

      await this.dynamoDBService.getClient().send(command);
    } catch (error) {
      console.error('Error updating book stats by book ID:', error);
      throw new InternalServerErrorException(
        'Failed to update book stats by book ID',
        error.message,
      );
    }
  }
}
