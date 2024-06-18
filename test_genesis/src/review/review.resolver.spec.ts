import { Test, TestingModule } from '@nestjs/testing';
import { ReviewResolver } from './review.resolver';
import { ReviewService } from './review.service';
import { CreateReviewInput } from './dto/create-review.input';
import { Review } from './entities/review.entity';
import { User } from '../user/enitites/user.entity';
import { UserDetails } from '../user/enitites/user-details.entity';
import { ApolloError, UserInputError } from 'apollo-server-express';
import { UserExistsInterceptor } from '../user/interceptors/user-exist.interceptor';
import { LoggerService } from '../logger/logger.service';
import { UserService } from '../user/user.service';
import { UserWithDetailsWithoutPassword } from '../auth/types/auth.type';
import { UserRoles } from '../user/enums/user-role.enum';
import { ReviewResponse, ReviewsPage } from './types/types';
import { UpdateReviewInput } from './dto/update-review.input';

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
      const mockUser: UserWithDetailsWithoutPassword = {
        id: 1,
        role: UserRoles.USER,
        details: {
          username: 'testuser',
        },
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
        createdAt: new Date(),
        updatedAt: new Date(),
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
      const mockUser: UserWithDetailsWithoutPassword = {
        id: 1,
        role: UserRoles.USER,
        details: {
          username: 'testuser',
        },
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
        createdAt: new Date(),
        updatedAt: new Date(),
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
        createdAt: new Date(),
        updatedAt: new Date(),
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

  describe('getReviewsWithPaging', () => {
    const mockReviews = [
      {
        reviewId: 'uid',
        bookId: 1,
        rating: 5,
        comment: 'Great book!',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockReviewsPage: ReviewsPage = {
      reviews: mockReviews,
      totalReviews: 1,
      lastEvaluatedKey: null,
      firstEvaluatedKey: null,
    };

    it('should return reviews from cache if available', async () => {
      const limit = 10;
      const page = 1;
      const offset = 0;
      const cacheKey = `reviews:${page}:${limit}:${offset}`;

      mockCacheManager.get.mockResolvedValueOnce(mockReviewsPage);

      const result = await reviewResolver.getReviewsWithPaging(
        limit,
        page,
        offset,
      );

      expect(result).toEqual(mockReviewsPage);
      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(mockReviewService.scanReviews).not.toHaveBeenCalled();
    });

    it('should return reviews from service if not in cache', async () => {
      const limit = 10;
      const page = 1;
      const offset = 0;
      const cacheKey = `reviews:${page}:${limit}:${offset}`;

      mockCacheManager.get.mockResolvedValueOnce(null);
      mockReviewService.scanReviews.mockResolvedValueOnce({
        reviews: mockReviews,
        totalReviews: 1,
        lastEvaluatedKey: null,
        firstEvaluatedKey: null,
      });

      const result = await reviewResolver.getReviewsWithPaging(
        limit,
        page,
        offset,
      );

      expect(result).toEqual(mockReviewsPage);
      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(mockReviewService.scanReviews).toHaveBeenCalledWith(
        limit,
        page,
        offset,
      );
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        cacheKey,
        mockReviewsPage,
      );
    });

    it('should handle errors appropriately', async () => {
      const limit = 10;
      const page = 1;
      const offset = 0;
      const cacheKey = `reviews:${page}:${limit}:${offset}`;

      mockCacheManager.get.mockResolvedValueOnce(null);
      mockReviewService.scanReviews.mockRejectedValueOnce(
        new Error('Unexpected error'),
      );

      await expect(
        reviewResolver.getReviewsWithPaging(limit, page, offset),
      ).rejects.toThrow(
        'Failed to find reviews with pagination: Unexpected error',
      );

      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(mockReviewService.scanReviews).toHaveBeenCalledWith(
        limit,
        page,
        offset,
      );
    });
  });

  describe('updateReview', () => {
    const reviewId = 'uuid';
    const updateReviewInput: UpdateReviewInput = {
      rating: 4,
      comment: 'Updated comment',
    };
    const currentUser = {
      id: 1,
      role: UserRoles.USER,
      details: {
        username: 'testuser',
      },
    };

    it('should update a review successfully', async () => {
      const updatedReview: Review = {
        reviewId: reviewId,
        bookId: 1,
        rating: 4,
        comment: 'Updated comment',
        userId: currentUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReviewService.update.mockResolvedValue(updatedReview);

      const result = await reviewResolver.updateReview(
        reviewId,
        updateReviewInput,
        currentUser,
      );

      expect(result).toEqual(updatedReview);
      expect(mockReviewService.update).toHaveBeenCalledWith(
        updateReviewInput,
        reviewId,
        currentUser.id,
      );
    });

    it('should throw an error if update fails', async () => {
      mockReviewService.update.mockRejectedValue(new Error('Update failed'));

      await expect(
        reviewResolver.updateReview(reviewId, updateReviewInput, currentUser),
      ).rejects.toThrow('Failed to update review');
    });
  });
});
