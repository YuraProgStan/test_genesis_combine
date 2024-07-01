import { Injectable } from '@nestjs/common';

import { InjectModel, Item, Model } from 'nestjs-dynamoose';
import { BookStats, BookStatsKey } from './schemas/book-stats.schema';

@Injectable()
export class BookStatsRepository {
  // eslint-disable-next-line no-empty-function
  constructor(
    @InjectModel('BookStats')
    private bookStatsModel: Model<BookStats, BookStatsKey>,
  ) {}

  async findByBookId(bookId: number): Promise<BookStats | null> {
    const key: BookStatsKey = { bookId: bookId.toString() };
    const result = await this.bookStatsModel.get(key);

    if (result) {
      return result as BookStats;
    }
    return null;
  }

  async updateByBookId(
    bookId: number,
    stats: {
      totalVotes: number;
      meanRating: number;
    },
  ) {
    const stringBookId = bookId.toString();
    const updatedBookStats = await this.bookStatsModel.update(
      { bookId: stringBookId },
      { totalVotes: stats.totalVotes, meanRating: stats.meanRating },
    );
    return updatedBookStats;
  }
}
