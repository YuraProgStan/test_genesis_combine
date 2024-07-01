import { ReviewService } from './review.service';
import { ReviewRepository } from './review.repository';
import { Review } from './schemas/review.schema';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BookStatsService } from './book-stats.service';
import { UserInputError } from 'apollo-server-express';
import { ReviewResponse, ReviewTransform } from './types/types';

describe('ReviewService', () => {
  let reviewService: ReviewService;
  let reviewRepository: any;
  let bookStatsService: BookStatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        {
          provide: ReviewRepository,
          useValue: {
            findAll: jest.fn(),
            findByReviewId: jest.fn(),
            findByUserId: jest.fn(),
            findUserVoteByBookIdAndUserId: jest.fn(),
            createReview: jest.fn(),

            // Add other methods as needed for your tests
          },
        },
        {
          provide: BookStatsService,
          useValue: {
            findByBookId: jest.fn(),
            // Add other methods as needed for your tests
          },
        },
      ],
    }).compile();

    reviewService = module.get<ReviewService>(ReviewService);
    reviewRepository = module.get<ReviewRepository>(ReviewRepository);
    bookStatsService = module.get<BookStatsService>(BookStatsService);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return transformed reviews array', async () => {
      // Mock data for review repository findAll method
      const mockReviews: Review[] = [
        {
          reviewId: 'mockReviewId1',
          userId: 1,
          bookId: 1,
          rating: 4,
          comment: 'Great book!',
          createdAt: new Date().getTime(),
          updatedAt: new Date().getTime(),
        },
        {
          reviewId: 'mockReviewId2',
          userId: 2,
          bookId: 1,
          rating: 4,
          comment: 'Excellent book!',
          createdAt: new Date().getTime(),
          updatedAt: new Date().getTime(),
        },
      ];

      // Mock reviewRepository findAll method
      jest.spyOn(reviewRepository, 'findAll').mockResolvedValue(mockReviews);

      // Expected transformed reviews
      const expectedTransformedReviews = mockReviews.map((review) => ({
        reviewId: review.reviewId,
        userId: review.userId,
        bookId: review.bookId,
        rating: review.rating,
        comment: review.comment,
        createdAt: new Date(review.createdAt).toISOString(),
        updatedAt: new Date(review.updatedAt).toISOString(),
        // Add any transformation logic as needed
      }));

      // Call the service method
      const transformedReviews = await reviewService.findAll();

      // Assert
      expect(transformedReviews).toEqual(expectedTransformedReviews);
    });

    it('should throw InternalServerErrorException on repository error', async () => {
      // Mock reviewRepository findAll method to throw an error
      jest.spyOn(reviewRepository, 'findAll').mockRejectedValue(new Error());

      // Call the service method and expect it to throw InternalServerErrorException
      await expect(reviewService.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
  describe('findByReviewId', () => {
    it('should return review data with rating when review is found', async () => {
      const mockReviewId = 'mockReviewId';
      const mockReview = {
        reviewId: mockReviewId,
        userId: 1,
        bookId: 1,
        rating: 4,
        comment: 'Great book!',
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
      };
      const mockTransformedReview: ReviewTransform = {
        reviewId: mockReview.reviewId,
        userId: mockReview.userId,
        bookId: mockReview.bookId,
        rating: mockReview.rating,
        comment: mockReview.comment,
        createdAt: new Date(mockReview.createdAt).toISOString(),
        updatedAt: new Date(mockReview.updatedAt).toISOString(),
      };
      const mockRating = { totalVotes: 1, meanRating: 4 }; // Mock rating data

      jest
        .spyOn(reviewRepository, 'findByReviewId')
        .mockResolvedValue(mockReview);
      jest
        .spyOn(bookStatsService, 'findByBookId')
        .mockResolvedValue(mockRating);

      const result: ReviewResponse =
        await reviewService.findByReviewId(mockReviewId);

      expect(result).toEqual({
        ...mockTransformedReview,
        ...mockRating,
      });
    });

    it('should throw UserInputError if review is not found', async () => {
      const mockReviewId = 'nonExistingReviewId';

      jest.spyOn(reviewRepository, 'findByReviewId').mockResolvedValue(null);

      await expect(
        reviewService.findByReviewId(mockReviewId),
      ).rejects.toThrowError(UserInputError);
    });

    it('should throw InternalServerErrorException on repository error', async () => {
      const mockReviewId = 'mockReviewId';

      jest
        .spyOn(reviewRepository, 'findByReviewId')
        .mockRejectedValue(new Error());

      await expect(
        reviewService.findByReviewId(mockReviewId),
      ).rejects.toThrowError(InternalServerErrorException);
    });

    describe('findByUserId', () => {
      it('should return transformed reviews array', async () => {
        const userId = 1;
        const mockReviews: Review[] = [
          {
            reviewId: 'mockReviewId1',
            userId: userId,
            bookId: 1,
            rating: 4,
            comment: 'Great book!',
            createdAt: new Date().getTime(),
            updatedAt: new Date().getTime(),
          },
          {
            reviewId: 'mockReviewId2',
            userId: userId,
            bookId: 2,
            rating: 5,
            comment: 'Excellent book!',
            createdAt: new Date().getTime(),
            updatedAt: new Date().getTime(),
          },
        ];

        jest
          .spyOn(reviewRepository, 'findByUserId')
          .mockResolvedValue(mockReviews);

        const expectedTransformedReviews = mockReviews.map((review) => ({
          reviewId: review.reviewId,
          userId: review.userId,
          bookId: review.bookId,
          rating: review.rating,
          comment: review.comment,
          createdAt: new Date(review.createdAt).toISOString(),
          updatedAt: new Date(review.updatedAt).toISOString(),
        }));

        // Call the service method
        const transformedReviews = await reviewService.findByUserId(userId);

        // Assert
        expect(transformedReviews).toEqual(expectedTransformedReviews);
      });

      it('should throw InternalServerErrorException on repository error', async () => {
        const userId = 1;

        jest
          .spyOn(reviewRepository, 'findByUserId')
          .mockRejectedValue(new Error());

        await expect(reviewService.findByUserId(userId)).rejects.toThrowError(
          InternalServerErrorException,
        );
      });
    });
  });
});
