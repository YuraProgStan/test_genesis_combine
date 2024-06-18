import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Inject, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Review } from './entities/review.entity';
import { CreateReviewInput } from './dto/create-review.input';
import { UpdateReviewInput } from './dto/update-review.input';
import { ReviewService } from './review.service';
import { ApolloError, UserInputError } from 'apollo-server-express';
import { ReviewResponse, ReviewsPage, ReviewsResponse } from './types/types';
import { CurrentUser } from '../user/decorators/users.decorator';
import { UserExistsInterceptor } from '../user/interceptors/user-exist.interceptor';
import { ReviewCacheService } from '../cache/review/review-cache.service';
import { UserWithDetailsWithoutPassword } from '../auth/types/auth.type';

@Resolver(() => Review)
export class ReviewResolver {
  constructor(
    private readonly reviewService: ReviewService,
    @Inject('REVIEW_CACHE_MANAGER')
    private readonly cacheManager: ReviewCacheService,
  ) {}

  @Mutation(() => ReviewResponse, { name: 'createReview' })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(UserExistsInterceptor)
  async createReview(
    @Args('createReviewInput') createReviewInput: CreateReviewInput,
    @CurrentUser() currentUser: UserWithDetailsWithoutPassword,
  ): Promise<Review> {
    try {
      return await this.reviewService.createOrUpdateVote(
        createReviewInput,
        currentUser,
      );
    } catch (error) {
      throw new ApolloError('Failed to create review', 'INTERNAL_SERVER_ERROR');
    }
  }

  @Query(() => ReviewResponse, { name: 'review' })
  async getReviewById(
    @Args('reviewId', { type: () => ID }) reviewId: string,
  ): Promise<Review> {
    try {
      const cacheKey = `book:${reviewId}`;
      const cachedReview = await this.cacheManager.get(cacheKey);
      if (cachedReview) {
        return cachedReview;
      }
      const review: ReviewResponse =
        await this.reviewService.findByReviewId(reviewId);
      await this.cacheManager.set(cacheKey, review);
      return review;
    } catch (error) {
      if (error instanceof UserInputError) {
        throw error;
      } else {
        throw new ApolloError(
          'Failed to find review by ID',
          'INTERNAL_SERVER_ERROR',
        );
      }
    }
  }

  @Query(() => ReviewsResponse, { name: 'reviewsByBookId' })
  async getReviewsByBookId(
    @Args('bookId') bookId: number,
  ): Promise<{ reviews: Review[]; totalVotes: number; meanRating: number }> {
    try {
      const cacheKey = `reviews:bookId:${bookId}`;
      const cachedReviews = await this.cacheManager.get(cacheKey);
      if (cachedReviews) {
        return cachedReviews;
      }
      const riviews: ReviewsResponse =
        await this.reviewService.findByBookId(bookId);
      await this.cacheManager.set(cacheKey, riviews);
      return riviews;
    } catch (error) {
      throw new ApolloError(
        'Failed to find reviews by book ID',
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @Query(() => [Review], { name: 'reviewsByUserId' })
  async getReviewsByUserId(@Args('userId') userId: number): Promise<Review[]> {
    try {
      const cacheKey = `reviews:userId:${userId}`;
      const cachedReviews = await this.cacheManager.get(cacheKey);
      if (cachedReviews) {
        return cachedReviews;
      }
      const reviews: Review[] = await this.reviewService.findByUserId(userId);
      await this.cacheManager.set(cacheKey, reviews);
      return reviews;
    } catch (error) {
      throw new ApolloError(
        'Failed to find reviews by user ID',
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @Query(() => ReviewsPage, { name: 'reviews' })
  async getReviewsWithPaging(
    @Args('limit', { type: () => Int }) limit: number,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<ReviewsPage> {
    try {
      const cacheKey = `reviews:${page}:${limit}:${offset}`;

      const cachedReviews = await this.cacheManager.get(cacheKey);
      if (cachedReviews) {
        return cachedReviews;
      }
      const result = await this.reviewService.scanReviews(limit, page, offset);

      const serializedReviews = result.reviews.map((review) => ({
        ...review,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt ? review.updatedAt : null,
      }));

      const response = {
        reviews: serializedReviews,
        totalReviews: result.totalReviews,
        lastEvaluatedKey: result.lastEvaluatedKey
          ? JSON.stringify(result.lastEvaluatedKey)
          : null,
        firstEvaluatedKey: result.firstEvaluatedKey
          ? JSON.stringify(result.firstEvaluatedKey)
          : null,
      };
      await this.cacheManager.set(cacheKey, response);
      return response;
    } catch (error) {
      throw new Error(
        `Failed to find reviews with pagination: ${error.message}`,
      );
    }
  }

  @Mutation(() => Review, { name: 'updateReview' })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(UserExistsInterceptor)
  async updateReview(
    @Args('reviewId') reviewId: string,
    @Args('updateReviewInput') updateReviewInput: UpdateReviewInput,
    @CurrentUser() currentUser: UserWithDetailsWithoutPassword,
  ): Promise<Review> {
    try {
      return await this.reviewService.update(
        updateReviewInput,
        reviewId,
        currentUser.id,
      );
    } catch (error) {
      throw new ApolloError('Failed to update review', 'INTERNAL_SERVER_ERROR');
    }
  }

  @Mutation(() => Boolean, { name: 'removeReview' })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(UserExistsInterceptor)
  async removeReview(
    @Args('reviewId', { type: () => ID }) reviewId: string,
  ): Promise<boolean> {
    try {
      return await this.reviewService.deleteById(reviewId);
    } catch (error) {
      throw new ApolloError('Failed to remove review', 'INTERNAL_SERVER_ERROR');
    }
  }
}
