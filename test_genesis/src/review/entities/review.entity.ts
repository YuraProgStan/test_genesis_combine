import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { CreateReviewInput } from '../dto/create-review.input';
import { randomUUID as uuidv4 } from 'crypto';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import {ReviewInput} from "../types/types";

@ObjectType({ description: 'Review object type.' })
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

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date, { nullable: true }) // add this decorator
  updatedAt?: Date;

  static newInstanceFromDTO(data: ReviewInput) {
    const result = new Review();
    result.reviewId = uuidv4();
    result.comment = data.comment;
    result.bookId = data.bookId;
    result.userId = data.userId;
    result.rating = data.rating;
    result.createdAt = new Date();

    return result;
  }
  static newInstanceFromDynamoDBObject(data: any): Review {
    const result = new Review();
    result.reviewId = data.reviewId.S;
    result.comment = data.comment.S;
    result.bookId = Number(data.bookId.N);
    result.userId = Number(data.userId.N);
    result.rating = Number(data.rating.N);
    result.createdAt = new Date(Number(data.createdAt.N));
    if (data.updatedAt) {
      result.updatedAt = new Date(Number(data.updatedAt.N));
    }
    return result;
  }

  static InstanceToDynamoDBItem(
    review: Review,
  ): Record<string, AttributeValue> {
    return {
      reviewId: { S: review.reviewId },
      comment: { S: review.comment },
      bookId: { N: review.bookId.toString() },
      userId: { N: review.userId.toString() },
      rating: { N: review.rating.toString() },
      createdAt: { N: review.createdAt.getTime().toString() },
      updatedAt: { N: review.updatedAt.getTime().toString() },
    };
  }
}
