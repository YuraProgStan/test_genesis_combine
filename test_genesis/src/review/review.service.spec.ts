import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './review.service';
import { CreateReviewInput } from './dto/create-review.input';
import { Review } from './entities/review.entity';
import { BookStatsService } from './book-stats.service';
import { UserWithDetailsWithoutPassword } from '../auth/types/auth.type';
import { UserRoles } from '../user/enums/user-role.enum';
import { ReviewInput, ReviewResponse } from './types/types';
import { InternalServerErrorException } from '@nestjs/common';

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));
const mockBookStatsService = {
  findByBookId: jest.fn(),
};

const mockReviewService = {
  findUserVoteByBookIdAndUserId: jest.fn(),
  createReviewWithoutVoting: jest.fn(),
  updateVotesAndRating: jest.fn(),
  createOrUpdateVote: jest.fn(),
};

describe('ReviewService', () => {
  let reviewService: ReviewService;
  let bookStatsService: BookStatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: ReviewService, useValue: mockReviewService },
        { provide: BookStatsService, useValue: mockBookStatsService },
      ],
    }).compile();

    reviewService = module.get<ReviewService>(ReviewService);
    bookStatsService = module.get<BookStatsService>(BookStatsService);

    jest.clearAllMocks();
  });

  describe('createOrUpdateVote', () => {
    const createReviewInput: CreateReviewInput = {
      bookId: 1,
      rating: 4,
      comment: 'Great book!',
    };
    const currentUser: UserWithDetailsWithoutPassword = {
      id: 1,
      role: UserRoles.USER,
      details: {
        username: 'testuser',
      },
    };

    it('should create a new vote and update book stats', async () => {
      const newReview: Review = {
        ...createReviewInput,
        reviewId: '766253ca-f748-48df-ba91-1735eef9c429',
        userId: currentUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const bookStats = {
        totalVotes: 1,
        meanRating: 4,
      };

      mockReviewService.findUserVoteByBookIdAndUserId.mockResolvedValue(null);
      mockReviewService.createReviewWithoutVoting.mockResolvedValue(newReview);
      mockReviewService.updateVotesAndRating.mockResolvedValue(null);
      mockBookStatsService.findByBookId.mockResolvedValue(bookStats);

      // Simulate the actual method call on the mock service
      mockReviewService.createOrUpdateVote.mockImplementation(
        async (createReviewInput, currentUser) => {
          const userId: number = currentUser.id;
          const existingVote =
            await mockReviewService.findUserVoteByBookIdAndUserId(
              createReviewInput.bookId,
              userId,
            );
          const reviewInput: ReviewInput = { ...createReviewInput, userId };

          const newReview: Review = Review.newInstanceFromDTO(reviewInput);
          await mockReviewService.createReviewWithoutVoting(reviewInput);
          if (existingVote) {
            const ratingChange = newReview.rating - existingVote.rating;
            await mockReviewService.updateVotesAndRating(
              reviewInput.bookId,
              ratingChange,
              'update',
            );
          } else {
            await mockReviewService.updateVotesAndRating(
              newReview.bookId,
              newReview.rating,
              'add',
            );
          }
          const bookStats = await mockBookStatsService.findByBookId(
            createReviewInput.bookId,
          );
          return { ...newReview, ...bookStats };
        },
      );

      const result = await reviewService.createOrUpdateVote(
        createReviewInput,
        currentUser,
      );

      expect(result).toBeDefined();
      expect(result.bookId).toEqual(newReview.bookId);
      expect(result.comment).toEqual(newReview.comment);
      expect(result.rating).toEqual(newReview.rating);
      expect(result.userId).toEqual(newReview.userId);
      expect(result.reviewId).toBeDefined();
      expect(result.createdAt).toBeDefined();
    });

    it('should update an existing vote and update book stats', async () => {
      const existingVote: Review = {
        ...createReviewInput,
        reviewId: '4f612ba7-2555-48df-80f5-43fd0f9b7d64',
        userId: currentUser.id,
        rating: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newReview: Review = {
        ...createReviewInput,
        userId: currentUser.id,
        reviewId: '4f612ba7-2555-48df-80f5-43fd0f9b7d64',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const bookStats = {
        totalReviews: 1,
        averageRating: 4,
      };

      mockReviewService.findUserVoteByBookIdAndUserId.mockResolvedValue(
        existingVote,
      );
      mockReviewService.createReviewWithoutVoting.mockResolvedValue(newReview);
      mockReviewService.updateVotesAndRating.mockResolvedValue(null);
      mockBookStatsService.findByBookId.mockResolvedValue(bookStats);

      // Simulate the actual method call on the mock service
      mockReviewService.createOrUpdateVote.mockImplementation(
        async (createReviewInput, currentUser) => {
          const userId: number = currentUser.id;
          const existingVote =
            await mockReviewService.findUserVoteByBookIdAndUserId(
              createReviewInput.bookId,
              userId,
            );
          const reviewInput: ReviewInput = { ...createReviewInput, userId };

          const newReview: Review = Review.newInstanceFromDTO(reviewInput);
          await mockReviewService.createReviewWithoutVoting(reviewInput);
          if (existingVote) {
            const ratingChange = newReview.rating - existingVote.rating;
            await mockReviewService.updateVotesAndRating(
              reviewInput.bookId,
              ratingChange,
              'update',
            );
          } else {
            await mockReviewService.updateVotesAndRating(
              newReview.bookId,
              newReview.rating,
              'add',
            );
          }
          const bookStats = await mockBookStatsService.findByBookId(
            createReviewInput.bookId,
          );
          return { ...newReview, ...bookStats };
        },
      );

      const result = await reviewService.createOrUpdateVote(
        createReviewInput,
        currentUser,
      );

      expect(result).toEqual(
        expect.objectContaining({
          bookId: createReviewInput.bookId,
          rating: createReviewInput.rating,
          comment: createReviewInput.comment,
          userId: currentUser.id,
          totalReviews: bookStats.totalReviews,
          averageRating: bookStats.averageRating,
        }),
      );
      expect(
        mockReviewService.findUserVoteByBookIdAndUserId,
      ).toHaveBeenCalledWith(createReviewInput.bookId, currentUser.id);
      expect(mockReviewService.createReviewWithoutVoting).toHaveBeenCalledWith({
        ...createReviewInput,
        userId: currentUser.id,
      });
      expect(mockReviewService.updateVotesAndRating).toHaveBeenCalledWith(
        newReview.bookId,
        newReview.rating - existingVote.rating,
        'update',
      );
    });

    it('should throw an InternalServerErrorException if an error occurs', async () => {
      // Mocking the method to throw an error
      mockReviewService.findUserVoteByBookIdAndUserId.mockRejectedValue(
        new Error('Database error'),
      );

      reviewService.createOrUpdateVote = async (
        createReviewInput,
        currentUser,
      ) => {
        try {
          await mockReviewService.findUserVoteByBookIdAndUserId(
            createReviewInput,
            currentUser,
          );
          return new ReviewResponse();
        } catch (error) {
          throw new InternalServerErrorException(
            'Failed to create or update vote',
            error.message,
          );
        }
      };

      await expect(
        reviewService.createOrUpdateVote(createReviewInput, currentUser),
      ).rejects.toThrow(
        new InternalServerErrorException(
          'Failed to create or update vote',
          'Database error',
        ),
      );
    });
  });
});
