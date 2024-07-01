import { Injectable } from '@nestjs/common';
import { ReviewInput } from './types/types';
import { InjectModel, Model } from 'nestjs-dynamoose';
import { Review, ReviewKey } from './schemas/review.schema';
import { SortOrder } from 'dynamoose/dist/General';
import { randomUUID as uuidv4 } from 'crypto';
@Injectable()
export class ReviewRepository {
  constructor(
    @InjectModel('Review')
    private reviewModel: Model<Review, ReviewKey>,
  ) {}

  async findAll(): Promise<Review[]> {
    const result = await this.reviewModel
      .query()
      .sort(SortOrder.descending)
      .limit(10)
      .exec();

    if (!result || result.length === 0) {
      return [];
    }

    return result;
  }

  async findByReviewId(reviewId: string): Promise<Review> {
    const result = await this.reviewModel.get({ reviewId });
    return result;
  }

  async findByBookId(bookId: number): Promise<Review[]> {
    const result = await this.reviewModel
      .query('bookId')
      .eq(bookId)
      .using('GSI1') // Specify the index name
      .sort(SortOrder.descending)
      .limit(10)
      .exec();

    if (!result || result.length === 0) {
      return [];
    }

    return result;
  }

  async findByUserId(userId: number): Promise<Review[]> {
    const result = await this.reviewModel
      .query('userId')
      .eq(userId)
      .using('GSI2') // Specify the index name
      .sort(SortOrder.descending)
      .limit(10)
      .exec();

    if (!result || result.length === 0) {
      return [];
    }

    return result;
  }

  async findByBookIdAndUserId(
    bookId: number,
    userId: number,
  ): Promise<Review | null> {
    const result = await this.reviewModel
      .query('bookId')
      .eq(bookId)
      .using('GSI1')
      .where('userId')
      .eq(userId)
      .sort(SortOrder.descending)
      .exec();

    if (result.count > 0) {
      return result[0] as Review;
    }
    return null;
  }

  async createReview(reviewInput: ReviewInput): Promise<Review> {
    const reviewId = uuidv4();
    const createdAt = Date.now();
    const updatedAt = Date.now();

    const review: Review = await this.reviewModel.create({
      ...reviewInput,
      reviewId,
      createdAt,
      updatedAt,
    });

    return review;
  }

  async updateReview(reviewId, updatedData): Promise<Review> {
    const updatedReview: Review = await this.reviewModel.update(
      { reviewId },
      updatedData,
    );
    return updatedReview;
  }

  async deleteById(reviewId): Promise<{ success: boolean }> {
    await this.reviewModel.delete({
      reviewId,
    });
    return { success: true };
  }
}
