import * as dynamoose from 'dynamoose';
import { ReviewTransform } from '../types/types';
import { Field, ID, ObjectType } from '@nestjs/graphql';

const ReviewSchema = new dynamoose.Schema(
  {
    reviewId: {
      type: String,
      hashKey: true,
    },
    comment: {
      type: String,
      required: true,
    },
    bookId: {
      type: Number,
      required: true,
      index: {
        name: 'GSI1',
        type: 'global',
        rangeKey: 'updatedAt',
      },
    },
    userId: {
      type: Number,
      required: true,
      index: {
        name: 'GSI2',
        type: 'global',
        rangeKey: 'updatedAt',
      },
    },
    rating: {
      type: Number,
      required: true,
    },
  },
  {
    saveUnknown: false,
    timestamps: true,
  },
);

@ObjectType()
export class Review {
  @Field(() => ID)
  reviewId: string;

  @Field(() => String)
  comment: string;

  @Field(() => Number)
  bookId: number;

  @Field(() => Number)
  userId: number;

  @Field(() => Number)
  rating: number;

  @Field(() => Number)
  createdAt: number;

  @Field(() => Number) // add this decorator
  updatedAt: number;

  static newInstanceFromDynamoDBDormObject(data: Review): ReviewTransform {
    const result = new ReviewTransform();
    result.reviewId = data.reviewId;
    result.comment = data.comment;
    result.bookId = data.bookId;
    result.userId = data.userId;
    result.rating = data.rating;
    result.createdAt = new Date(data.createdAt).toISOString();
    result.updatedAt = new Date(data.updatedAt).toISOString();
    return result;
  }
}
@ObjectType()
export class ReviewKey {
  @Field(() => ID)
  reviewId: string;
}

export { ReviewSchema };
