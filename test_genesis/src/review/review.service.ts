import {
  AttributeValue,
  DeleteItemCommand,
  QueryCommand,
  PutItemCommand,
  ScanCommand,
  ScanCommandInput,
} from '@aws-sdk/client-dynamodb';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Review } from './entities/review.entity';
import { UpdateReviewInput } from './dto/update-review.input';
import { CreateReviewInput } from './dto/create-review.input';
import { DynamoDBService } from '../dynamodb/dynamodb.service';
import { UserInputError } from 'apollo-server-express';
import { DYNAMO_DB_TABLES } from '../dynamodb/constants';
import { BookStatsService } from './book-stats.service';
import {
  ReviewInput,
  ReviewResponse,
  UpdateReviewInputWithUserId,
} from './types/types';
import { LoggerService } from '../logger/logger.service';
import { SCAN_REVIEWS_TYPE } from '../constants/constants';
import { UserWithDetailsWithoutPassword } from '../auth/types/auth.type';
@Injectable()
export class ReviewService {
  private readonly tableName: string = DYNAMO_DB_TABLES.REVIEWS;
  private readonly totalSegments: number = SCAN_REVIEWS_TYPE.TOTALSEGMENTS;
  private readonly segment: number = SCAN_REVIEWS_TYPE.SEGMENT;

  constructor(
    private readonly dynamoDBService: DynamoDBService,
    private readonly bookStatsService: BookStatsService,
    private readonly logger: LoggerService,
  ) {}
  private async executeCommand(command: any): Promise<any> {
    try {
      return await this.dynamoDBService.getClient().send(command);
    } catch (error) {
      console.error('Error executing command:', error);
      throw new InternalServerErrorException(
        `Failed to execute command: ${error.message}`,
      );
    }
  }

  public async findAll(): Promise<Review[]> {
    try {
      const response = await this.executeCommand(
        new ScanCommand({ TableName: this.tableName }),
      );
      return response.Items
        ? response.Items.map((item) =>
            Review.newInstanceFromDynamoDBObject(item),
          )
        : [];
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch all reviews from DB',
        error.message,
      );
    }
  }

  public async findByReviewId(reviewId: string): Promise<ReviewResponse> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'reviewId = :reviewId',
        ExpressionAttributeValues: {
          ':reviewId': { S: reviewId },
        },
      });
      const response = await this.executeCommand(command);
      if (!response.Items || response.Items.length === 0) {
        throw new UserInputError(
          `No existing data for this reviewId: ${reviewId}`,
        );
      }
      const item = response.Items[0];
      const review = Review.newInstanceFromDynamoDBObject(item);
      const rating = await this.bookStatsService.findByBookId(review.bookId);
      return { ...review, ...rating };
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

  public async findByBookId(
    bookId: number,
  ): Promise<{ reviews: Review[]; totalVotes: number; meanRating: number }> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: 'bookId-index',
        KeyConditionExpression: 'bookId = :bookId',
        ExpressionAttributeValues: {
          ':bookId': { N: String(bookId) },
        },
      });
      const response = await this.executeCommand(command);
      const reviews = response.Items
        ? response.Items.map((item) =>
            Review.newInstanceFromDynamoDBObject(item),
          )
        : [];
      const bookStats = await this.bookStatsService.findByBookId(bookId);
      return {
        reviews,
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

  public async findByUserId(userId: number): Promise<Review[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { N: String(userId) },
        },
      });
      const response = await this.executeCommand(command);
      return response.Items
        ? response.Items.map((item) =>
            Review.newInstanceFromDynamoDBObject(item),
          )
        : [];
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch reviews by User ID from DB',
        error.message,
      );
    }
  }

  public async createOrUpdateVote(
    createReviewInput: CreateReviewInput,
    currentUser: UserWithDetailsWithoutPassword,
  ): Promise<ReviewResponse> {
    const userId: number = currentUser.id;
    try {
      const existingVote = await this.findUserVoteByBookIdAndUserId(
        createReviewInput.bookId,
        userId,
      );
      const reviewInput: ReviewInput = { ...createReviewInput, userId };

      const newReview: Review = Review.newInstanceFromDTO(reviewInput);
      await this.createReviewWithoutVoting(reviewInput);
      if (existingVote) {
        const ratingChange = newReview.rating - existingVote.rating;
        await this.updateVotesAndRating(
          reviewInput.bookId,
          ratingChange,
          'update',
        );
      } else {
        await this.updateVotesAndRating(
          newReview.bookId,
          newReview.rating,
          'add',
        );
      }
      const bookStats = await this.bookStatsService.findByBookId(
        createReviewInput.bookId,
      );
      return { ...newReview, ...bookStats };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create or update vote',
        error.message,
      );
    }
  }

  public async update(
    updateReviewInput: UpdateReviewInput,
    reviewId: string,
    userId: number,
  ): Promise<Review> {
    try {
      const existingReview = await this.findByReviewId(reviewId);
      if (!existingReview) {
        throw new UserInputError(`Review with ID ${reviewId} not found.`);
      }

      const updateReviewInputWithUserId: UpdateReviewInputWithUserId = {
        ...updateReviewInput,
        userId,
      };
      // Create a new Review object from the updateReviewInput
      const updatedReviewData = {
        ...existingReview,
        ...updateReviewInputWithUserId,
        updatedAt: new Date(),
      };
      const updatedReview = Review.newInstanceFromDTO(updatedReviewData);

      // Call the updateReview method with the new Review object
      await this.updateReview(updatedReview, existingReview);
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

  public async deleteById(reviewId: string): Promise<boolean> {
    try {
      const command = new DeleteItemCommand({
        TableName: this.tableName,
        Key: { reviewId: { S: reviewId } },
        ReturnConsumedCapacity: 'TOTAL',
        ReturnValues: 'ALL_OLD',
      });
      const result = await this.dynamoDBService.getClient().send(command);
      if (result.Attributes) {
        const oldReview = Review.newInstanceFromDynamoDBObject(
          result.Attributes,
        );
        await this.updateVotesAndRating(
          oldReview.bookId,
          -oldReview.rating,
          'subtract',
        );
        return true;
      }
      return false;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to delete review by ID',
        error.message,
      );
    }
  }

  private async create(newReview: Review): Promise<ReviewResponse> {
    try {
      const itemObject: Record<string, AttributeValue> = {
        reviewId: { S: newReview.reviewId },
        comment: { S: newReview.comment },
        bookId: { N: String(newReview.bookId) },
        userId: { N: String(newReview.userId) },
        rating: { N: String(newReview.rating) },
        createdAt: { N: newReview.createdAt.getTime().toString() },
      };
      await this.executeCommand(
        new PutItemCommand({ TableName: this.tableName, Item: itemObject }),
      );
      const bookStats = await this.bookStatsService.findByBookId(
        newReview.bookId,
      );
      return {
        ...newReview,
        ...bookStats,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create review',
        error.message,
      );
    }
  }

  private async updateReview(
    updatedReview: Review,
    existingReview: Review,
  ): Promise<void> {
    try {
      const itemObject = Review.InstanceToDynamoDBItem(updatedReview);
      await this.executeCommand(
        new PutItemCommand({ TableName: this.tableName, Item: itemObject }),
      );
      const ratingChange = updatedReview.rating - existingReview.rating;
      await this.updateVotesAndRating(
        updatedReview.bookId,
        ratingChange,
        'update',
      );
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
  ): Promise<Review | null> {
    try {
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'bookId = :bookId and userId = :userId',
        ExpressionAttributeValues: {
          ':bookId': { N: String(bookId) },
          ':userId': { N: String(userId) },
        },
      });
      const response = await this.executeCommand(command);

      if (response.Items && response.Items.length > 0) {
        const item = response.Items[0];
        const review = Review.newInstanceFromDynamoDBObject(item);
        return review;
      } else {
        return null;
      }
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to find user vote',
        error.message,
      );
    }
  }

  private async createReviewWithoutVoting(
    createReviewInput: ReviewInput,
  ): Promise<void> {
    try {
      const newReview: Review = Review.newInstanceFromDTO(createReviewInput);
      const itemObject: Record<string, AttributeValue> = {
        reviewId: { S: newReview.reviewId },
        comment: { S: newReview.comment },
        bookId: { N: String(newReview.bookId) },
        userId: { N: String(newReview.userId) },
        rating: { N: String(newReview.rating) },
        createdAt: { N: newReview.createdAt.getTime().toString() },
      };

      const command = new PutItemCommand({
        TableName: this.tableName,
        Item: itemObject,
      });

      await this.executeCommand(command);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create new review in DB',
        error.message,
      );
    }
  }
  async scanReviews(
    limit: number,
    page?: number,
    offset?: number,
  ): Promise<{
    reviews: Review[];
    totalReviews: number;
    lastEvaluatedKey: any;
    firstEvaluatedKey: any;
  }> {
    let reviews: Review[] = [];
    let lastEvaluatedKey: any = null;
    let totalReviews: number = 0;

    const params: ScanCommandInput = {
      TableName: this.tableName,
      TotalSegments: this.totalSegments,
      Segment: this.segment,
    };

    const initialParams = { ...params };

    // Handle pagination logic manually
    if (page && offset) {
      const targetCount = limit * page + offset;

      while (totalReviews < targetCount) {
        const command = new ScanCommand({
          ...initialParams,
          ExclusiveStartKey: lastEvaluatedKey,
        });

        const result = await this.executeCommand(command);

        if (result.Items) {
          reviews = reviews.concat(
            result.Items.map((item) =>
              Review.newInstanceFromDynamoDBObject(item),
            ),
          );
        }

        lastEvaluatedKey = result.LastEvaluatedKey;
        totalReviews += result.Items ? result.Items.length : 0;

        if (!lastEvaluatedKey) {
          break; // Exit if no more pages
        }
      }

      // Slice the result to return only the offset items from the target page
      reviews = reviews.slice(
        (page - 1) * limit + offset,
        page * limit + offset,
      );
    } else {
      const command = new ScanCommand(params);
      const result = await this.executeCommand(command);

      if (result.Items) {
        reviews = result.Items.map((item) =>
          Review.newInstanceFromDynamoDBObject(item),
        );
      }

      lastEvaluatedKey = result.LastEvaluatedKey;
      totalReviews = reviews.length;
    }

    return {
      reviews,
      totalReviews,
      lastEvaluatedKey,
      firstEvaluatedKey: reviews.length > 0 ? reviews[0] : null,
    };
  }
}
