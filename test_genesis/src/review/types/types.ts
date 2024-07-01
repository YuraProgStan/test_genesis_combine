// eslint-disable-next-line max-classes-per-file
import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ReviewTransform {
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

  @Field()
  createdAt: string;

  @Field()
  updatedAt: string;
}
@ObjectType()
export class ReviewResponse extends ReviewTransform {
  @Field(() => Number)
  totalVotes: number;

  @Field(() => Float)
  meanRating: number;
}

@ObjectType()
export class ReviewsResponse {
  @Field(() => [ReviewTransform])
  reviews: ReviewTransform[];

  @Field(() => Number)
  totalVotes: number;

  @Field(() => Float)
  meanRating: number;
}

@ObjectType()
export class KeyAttribute {
  @Field(() => String, { nullable: true })
  key?: string;
}

@ObjectType()
export class ReviewIdInput {
  @Field()
  reviewId: string;
}

@ObjectType()
export class ReviewInput {
  @Field()
  comment: string;

  @Field()
  userId: number;

  @Field()
  bookId: number;

  @Field()
  rating: number;
}

export class UpdateReviewInputWithUserId {
  @Field()
  reviewId?: string;

  @Field()
  comment?: string;

  @Field()
  userId?: number;

  @Field()
  bookId?: number;

  @Field()
  rating?: number;
}

@ObjectType()
export class BookStatsTransform {
  @Field(() => ID)
  bookId: number;

  @Field(() => Number)
  totalVotes: number;

  @Field(() => Number)
  meanRating: number;
}
