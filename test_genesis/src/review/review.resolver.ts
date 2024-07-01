import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Inject, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateReviewInput } from './dto/create-review.input';
import { UpdateReviewInput } from './dto/update-review.input';
import { ApolloError, UserInputError } from 'apollo-server-express';
import {
  ReviewResponse,
  ReviewsResponse,
  ReviewTransform,
} from './types/types';
import { CurrentUser } from '../user/decorators/users.decorator';
import { UserExistsInterceptor } from '../user/interceptors/user-exist.interceptor';
import { ReviewCacheService } from '../cache/review/review-cache.service';
import { UserWithDetailsWithoutPassword } from '../auth/types/auth.type';
import { ReviewService } from './review.service';
import { Review } from './schemas/review.schema';
import { CurrentUserType } from '../user/types/user.type';

@Resolver(() => Review)
export class ReviewResolver {
  constructor(
    private readonly reviewService: ReviewService,
    @Inject('REVIEW_CACHE_MANAGER')
    private readonly cacheManager: ReviewCacheService,
    // eslint-disable-next-line no-empty-function
  ) {}

  @Mutation(() => ReviewResponse, { name: 'createReview' })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(UserExistsInterceptor)
  async createReview(
    @Args('createReviewInput') createReviewInput: CreateReviewInput,
    @CurrentUser() currentUser: CurrentUserType,
  ): Promise<ReviewTransform> {
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
  ): Promise<ReviewResponse> {
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
  ): Promise<ReviewsResponse> {
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
  async getReviewsByUserId(
    @Args('userId') userId: number,
  ): Promise<ReviewTransform[]> {
    try {
      const cacheKey = `reviews:userId:${userId}`;
      const cachedReviews = await this.cacheManager.get(cacheKey);
      if (cachedReviews) {
        return cachedReviews;
      }
      const reviews: ReviewTransform[] =
        await this.reviewService.findByUserId(userId);
      await this.cacheManager.set(cacheKey, reviews);
      return reviews;
    } catch (error) {
      throw new ApolloError(
        'Failed to find reviews by user ID',
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @Mutation(() => ReviewTransform, { name: 'updateReview' })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(UserExistsInterceptor)
  async updateReview(
    @Args('updateReviewInput') updateReviewInput: UpdateReviewInput,
    @CurrentUser() currentUser: CurrentUserType,
  ): Promise<ReviewTransform> {
    try {
      return await this.reviewService.update(updateReviewInput, currentUser.id);
    } catch (error) {
      throw new ApolloError('Failed to update review', 'INTERNAL_SERVER_ERROR');
    }
  }

  @Mutation(() => Review, { name: 'removeReview' })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(UserExistsInterceptor)
  async removeReview(
    @Args('reviewId', { type: () => ID }) reviewId: string,
  ): Promise<ReviewTransform> {
    try {
      return await this.reviewService.deleteById(reviewId);
    } catch (error) {
      throw new ApolloError('Failed to remove review', 'INTERNAL_SERVER_ERROR');
    }
  }
}
