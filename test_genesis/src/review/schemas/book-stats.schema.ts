import * as dynamoose from 'dynamoose';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { BookStatsTransform } from '../types/types';

const BookStatsSchema = new dynamoose.Schema({
  bookId: {
    type: String,
    hashKey: true,
  },
  totalVotes: {
    type: Number,
    required: true,
  },
  meanRating: {
    type: Number,
    required: true,
  },
});

@ObjectType({ description: 'BookStats object type.' })
export class BookStats {
  @Field(() => ID)
  bookId: string;

  @Field(() => Number)
  totalVotes: number;

  @Field(() => Number)
  meanRating: number;

  static newInstanceFromDynamoDBDormObject(
    data: BookStats,
  ): BookStatsTransform {
    const result = new BookStatsTransform();
    result.bookId = Number(data.bookId);
    result.totalVotes = data.totalVotes;
    result.meanRating = data.meanRating;
    return result;
  }
}

@ObjectType()
export class BookStatsKey {
  @Field(() => ID)
  bookId: string;
}

export { BookStatsSchema };
