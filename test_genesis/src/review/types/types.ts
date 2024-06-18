import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Review } from '../entities/review.entity';
@ObjectType()
export class ReviewResponse extends Review {
  @Field(() => Number)
  totalVotes: number;

  @Field(() => Float)
  meanRating: number;
}

@ObjectType()
export class ReviewsResponse {
  @Field(() => [Review])
  reviews: Review[];

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
export class ReviewsPage {
  @Field(() => [Review])
  reviews: Review[];

  @Field(() => Int)
  totalReviews: number;

  @Field(() => String, { nullable: true })
  lastEvaluatedKey?: string;

  @Field(() => String, { nullable: true })
  firstEvaluatedKey?: string;
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
