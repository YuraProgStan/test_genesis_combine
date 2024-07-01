import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DYNAMO_DB_TABLES } from '../dynamodb/constants';
import { BookStatsRepository } from './book-stats.repository';

@Injectable()
export class BookStatsService {
  private readonly tableName: string = DYNAMO_DB_TABLES.BOOK_STATS;

  constructor(
    private readonly bookStatsRepository: BookStatsRepository,
  ) {}

  async findByBookId(
    bookId: number,
  ): Promise<{ totalVotes: number; meanRating: number }> {
    try {
      const response = await this.bookStatsRepository.findByBookId(
        bookId,
      );
      if (!response) {
        return {
          totalVotes: 0,
          meanRating: 0,
        };
      }

      return {
        totalVotes: response.totalVotes,
        meanRating: Number(Number(response.meanRating).toFixed(2)),
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
      await this.bookStatsRepository.updateByBookId(bookId, stats);
    } catch (error) {
      console.error('Error updating book stats by book ID:', error);
      throw new InternalServerErrorException(
        'Failed to update book stats by book ID',
        error.message,
      );
    }
  }
}
