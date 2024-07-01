import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { UpdateReviewInput } from './dto/update-review.input';
import { CreateReviewInput } from './dto/create-review.input';
import { UserInputError } from 'apollo-server-express';
import { BookStatsService } from './book-stats.service';
import {
  ReviewInput,
  ReviewResponse,
  ReviewTransform,
  UpdateReviewInputWithUserId,
} from './types/types';
import { ReviewRepository } from './review.repository';
import { Review } from './schemas/review.schema';
import { CurrentUserType } from '../user/types/user.type';

@Injectable()
export class ReviewService {
  constructor(
    private readonly bookStatsService: BookStatsService,
    private readonly reviewRepository: ReviewRepository,
    // eslint-disable-next-line no-empty-function
  ) {}

  public async findAll(): Promise<ReviewTransform[]> {
    try {
      const reviews: Review[] = await this.reviewRepository.findAll();
      const transformedReview: ReviewTransform[] = reviews.map((review) =>
        Review.newInstanceFromDynamoDBDormObject(review),
      );
      return transformedReview;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch all reviews from DB',
        error.message,
      );
    }
  }

  public async findByReviewId(reviewId: string): Promise<ReviewResponse> {
    try {
      const review = await this.reviewRepository.findByReviewId(reviewId);
      if (!review) {
        throw new UserInputError(
          `No existing data for this reviewId: ${reviewId}`,
        );
      }
      const reviewTransform: ReviewTransform =
        Review.newInstanceFromDynamoDBDormObject(review);
      const rating = await this.bookStatsService.findByBookId(
        reviewTransform.bookId,
      );
      return { ...reviewTransform, ...rating };
    } catch (error) {
      if (error instanceof UserInputError) {
        throw error;
      } else {
        throw new InternalServerErrorException(
          'Failed to fetch review by review id from DB',
          error.message,
        );
      }
    }
  }

  public async findByBookId(bookId: number): Promise<{
    reviews: ReviewTransform[] | [];
    totalVotes: number;
    meanRating: number;
  }> {
    try {
      const reviews: Review[] =
        await this.reviewRepository.findByBookId(bookId);
      if (!reviews.length) {
        return {
          reviews: [],
          totalVotes: 0,
          meanRating: 0,
        };
      }

      const reviewsTransform: ReviewTransform[] = reviews.map(
        (review: Review) => Review.newInstanceFromDynamoDBDormObject(review),
      );
      const bookStats = await this.bookStatsService.findByBookId(bookId);
      return {
        reviews: reviewsTransform,
        totalVotes: bookStats.totalVotes,
        meanRating: bookStats.meanRating,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch reviews by book ID from DB',
        error.message,
      );
    }
  }

  public async findByUserId(userId: number): Promise<ReviewTransform[] | []> {
    try {
      const reviewNews = await this.reviewRepository.findByUserId(userId);

      const reviews: ReviewTransform[] = reviewNews.map((review: Review) =>
        Review.newInstanceFromDynamoDBDormObject(review),
      );
      return reviews;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch reviews by user ID from DB',
        error.message,
      );
    }
  }

  public async createOrUpdateVote(
    createReviewInput: CreateReviewInput,
    currentUser: CurrentUserType,
  ): Promise<ReviewResponse> {
    const userId: number = currentUser.id;
    try {
      const existingVote = await this.findUserVoteByBookIdAndUserId(
        createReviewInput.bookId,
        userId,
      );
      const reviewInput: ReviewInput = { ...createReviewInput, userId };

      const review: Review =
        await this.reviewRepository.createReview(reviewInput);
      if (existingVote) {
        const ratingChange = review.rating - existingVote.rating;

        await this.updateVotesAndRating(review.bookId, ratingChange, 'update');
      } else {
        await this.updateVotesAndRating(
          createReviewInput.bookId,
          createReviewInput.rating,
          'add',
        );
      }
      const bookStats = await this.bookStatsService.findByBookId(
        createReviewInput.bookId,
      );
      const reviewTransform: ReviewTransform =
        Review.newInstanceFromDynamoDBDormObject(review);
      return {
        ...reviewTransform,
        ...bookStats,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create or update vote',
        error.stack,
      );
    }
  }

  public async update(
    updateReviewInput: UpdateReviewInput,
    userId: number,
  ): Promise<ReviewTransform> {
    const { reviewId, ...restUpdateReviewInput } = updateReviewInput;
    try {
      const existingReview =
        await this.reviewRepository.findByReviewId(reviewId);
      if (!existingReview) {
        throw new UserInputError(`Review with ID ${reviewId} not found.`);
      }

      const updateReviewInputWithUserId: UpdateReviewInputWithUserId = {
        ...restUpdateReviewInput,
        userId,
      };
      // Create a new Review object from the updateReviewInput
      const updatedReviewData = {
        ...existingReview,
        ...updateReviewInputWithUserId,
      };
      const updatedReview: ReviewTransform = await this.updateReview(
        updatedReviewData,
        existingReview,
      );

      return updatedReview;
    } catch (error) {
      if (error instanceof UserInputError) {
        throw error;
      } else {
        throw new InternalServerErrorException(
          'Failed to update review',
          error.message,
        );
      }
    }
  }

  public async deleteById(reviewId: string): Promise<ReviewTransform> {
    try {
      const existReview = await this.reviewRepository.findByReviewId(reviewId);
      if (!existReview) {
        throw new UserInputError('This review id already not exist');
      }
      const result = await this.reviewRepository.deleteById(reviewId);
      if (!result.success) {
        throw new InternalServerErrorException('Failed to delete review by ID');
      }
      await this.updateVotesAndRating(
        existReview.bookId,
        -existReview.rating,
        'subtract',
      );
      const review: ReviewTransform =
        Review.newInstanceFromDynamoDBDormObject(existReview);
      return review;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to delete review by ID',
        error.message,
      );
    }
  }

  private async updateReview(
    updatedData: Review,
    existingReview: Review,
  ): Promise<ReviewTransform> {
    try {
      const { reviewId, createdAt, updatedAt, ...restUpdatedReview } =
        updatedData;
      const review: Review = await this.reviewRepository.updateReview(
        reviewId,
        restUpdatedReview,
      );
      const ratingChange = updatedData.rating - existingReview.rating;
      await this.updateVotesAndRating(
        updatedData.bookId,
        ratingChange,
        'update',
      );
      const updatedReviewTransform: ReviewTransform =
        Review.newInstanceFromDynamoDBDormObject(review);
      return updatedReviewTransform;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update review',
        error.message,
      );
    }
  }

  private async updateVotesAndRating(
    bookId: number,
    ratingChange: number,
    operation: 'add' | 'subtract' | 'update',
  ): Promise<void> {
    try {
      const bookStats = await this.bookStatsService.findByBookId(bookId);

      let totalVotes = bookStats.totalVotes;
      let totalRating = bookStats.meanRating * totalVotes;

      if (operation === 'add') {
        totalVotes += 1;
        totalRating += ratingChange;
      } else if (operation === 'subtract') {
        totalVotes -= 1;
        totalRating += ratingChange; // ratingChange is negative in this case
      } else if (operation === 'update') {
        totalRating += ratingChange;
      }

      const meanRating = totalVotes === 0 ? 0 : totalRating / totalVotes;

      await this.bookStatsService.updateByBookId(bookId, {
        totalVotes,
        meanRating,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update votes and rating in DB',
        error.message,
      );
    }
  }

  private async findUserVoteByBookIdAndUserId(
    bookId: number,
    userId: number,
  ): Promise<ReviewTransform | null> {
    try {
      const reviewNew: Review =
        await this.reviewRepository.findByBookIdAndUserId(bookId, userId);
      if (!reviewNew) {
        return null;
      }

      const review: ReviewTransform =
        Review.newInstanceFromDynamoDBDormObject(reviewNew);
      return review;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to find user vote',
        error.message,
      );
    }
  }
}
