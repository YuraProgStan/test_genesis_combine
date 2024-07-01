import { Test, TestingModule } from '@nestjs/testing';
import { ReviewResolver } from './review.resolver';
import { ReviewService } from './review.service';
import { CreateReviewInput } from './dto/create-review.input';
import { ApolloError, UserInputError } from 'apollo-server-express';
import { UserExistsInterceptor } from '../user/interceptors/user-exist.interceptor';
import { LoggerService } from '../logger/logger.service';
import { UserService } from '../user/user.service';
import { UserRoles } from '../user/enums/user-role.enum';
import { ReviewResponse } from './types/types';
import { UpdateReviewInput } from './dto/update-review.input';
import { Review } from './schemas/review.schema';
import { CurrentUserType } from '../user/types/user.type';

const mockReviewService = {
  createOrUpdateVote: jest.fn(),
  findByReviewId: jest.fn(),
  scanReviews: jest.fn(),
  update: jest.fn(),
};

const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
};

const mockUserService = {
  findById: jest.fn(),
};

const mockLoggerService = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

describe('ReviewResolver', () => {
  let reviewResolver: ReviewResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewResolver,
        {
          provide: ReviewService,
          useValue: mockReviewService,
        },
        {
          provide: 'REVIEW_CACHE_MANAGER',
          useValue: mockCacheManager,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
        UserExistsInterceptor,
      ],
    }).compile();

    reviewResolver = module.get<ReviewResolver>(ReviewResolver);
  });

  describe('createReview', () => {
    it('should create a review successfully', async () => {
      const mockUser: CurrentUserType = {
        id: 1,
        role: UserRoles.USER,
      };

      const mockReviewInput: CreateReviewInput = {
        bookId: 1,
        rating: 5,
        comment: 'Great book!',
      };

      const mockReview: Review = {
        reviewId: 'uid',
        bookId: 1,
        rating: 5,
        comment: 'Great book!',
        userId: 1,
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
      };

      mockReviewService.createOrUpdateVote.mockResolvedValueOnce(mockReview);

      const result = await reviewResolver.createReview(
        mockReviewInput,
        mockUser,
      );

      expect(result).toEqual(mockReview);
      expect(mockReviewService.createOrUpdateVote).toHaveBeenCalledWith(
        mockReviewInput,
        mockUser,
      );
    });

    it('should handle errors gracefully', async () => {
      const mockUser: CurrentUserType = {
        id: 1,
        role: UserRoles.USER,
      };

      const mockReviewInput: CreateReviewInput = {
        bookId: 1,
        rating: 5,
        comment: 'Great book!',
      };

      mockReviewService.createOrUpdateVote.mockRejectedValueOnce(
        new Error('Failed to create review'),
      );

      await expect(
        reviewResolver.createReview(mockReviewInput, mockUser),
      ).rejects.toThrow(ApolloError);
    });
  });

  describe('getReviewById', () => {
    it('should return review from cache if available', async () => {
      const reviewId = 'uid';
      const cacheKey = `book:${reviewId}`;
      const mockReview: ReviewResponse = {
        reviewId: reviewId,
        bookId: 1,
        rating: 5,
        comment: 'Great book!',
        userId: 1,
        createdAt: new Date().toString(),
        updatedAt: new Date().toString(),
        meanRating: 1,
        totalVotes: 1,
      };

      mockCacheManager.get.mockResolvedValueOnce(mockReview);

      const result = await reviewResolver.getReviewById(reviewId);

      expect(result).toEqual(mockReview);
      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(mockReviewService.findByReviewId).not.toHaveBeenCalled();
    });

    it('should return review from service if not in cache', async () => {
      const reviewId = 'uid';
      const cacheKey = `book:${reviewId}`;
      const mockReview: ReviewResponse = {
        reviewId: reviewId,
        bookId: 1,
        rating: 5,
        comment: 'Great book!',
        userId: 1,
        createdAt: new Date().toString(),
        updatedAt: new Date().toString(),
        meanRating: 1,
        totalVotes: 1,
      };

      mockCacheManager.get.mockResolvedValueOnce(null);
      mockReviewService.findByReviewId.mockResolvedValueOnce(mockReview);

      const result = await reviewResolver.getReviewById(reviewId);

      expect(result).toEqual(mockReview);
      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(mockReviewService.findByReviewId).toHaveBeenCalledWith(reviewId);
      expect(mockCacheManager.set).toHaveBeenCalledWith(cacheKey, mockReview);
    });

    it('should handle UserInputError', async () => {
      const reviewId = 'invalid_id';
      const cacheKey = `book:${reviewId}`;

      mockCacheManager.get.mockResolvedValueOnce(null);
      mockReviewService.findByReviewId.mockRejectedValueOnce(
        new UserInputError('Invalid review ID'),
      );

      await expect(reviewResolver.getReviewById(reviewId)).rejects.toThrow(
        UserInputError,
      );

      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(mockReviewService.findByReviewId).toHaveBeenCalledWith(reviewId);
    });

    it('should handle unexpected errors', async () => {
      const reviewId = '1';
      const cacheKey = `book:${reviewId}`;

      mockCacheManager.get.mockResolvedValueOnce(null);
      mockReviewService.findByReviewId.mockRejectedValueOnce(
        new Error('Unexpected error'),
      );

      await expect(reviewResolver.getReviewById(reviewId)).rejects.toThrow(
        ApolloError,
      );

      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(mockReviewService.findByReviewId).toHaveBeenCalledWith(reviewId);
    });
  });

  describe('updateReview', () => {
    const updateReviewInput: UpdateReviewInput = {
      reviewId: 'uuid',
      rating: 4,
      comment: 'Updated comment',
    };
    const currentUser: CurrentUserType = {
      id: 1,
      role: UserRoles.USER,
    };

    it('should update a review successfully', async () => {
      const updatedReview: Review = {
        reviewId: updateReviewInput.reviewId,
        bookId: 1,
        rating: 4,
        comment: 'Updated comment',
        userId: currentUser.id,
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
      };

      mockReviewService.update.mockResolvedValue(updatedReview);

      const result = await reviewResolver.updateReview(
        updateReviewInput,
        currentUser,
      );

      expect(result).toEqual(updatedReview);
      expect(mockReviewService.update).toHaveBeenCalledWith(
        updateReviewInput,
        currentUser.id,
      );
    });

    it('should throw an error if update fails', async () => {
      mockReviewService.update.mockRejectedValue(new Error('Update failed'));

      await expect(
        reviewResolver.updateReview(updateReviewInput, currentUser),
      ).rejects.toThrow('Failed to update review');
    });
  });
});
