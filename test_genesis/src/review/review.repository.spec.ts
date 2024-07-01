import { Test, TestingModule } from '@nestjs/testing';
import { ReviewRepository } from './review.repository';
import { Review, ReviewKey } from './schemas/review.schema';
import { getModelToken, Model } from 'nestjs-dynamoose';

describe('ReviewRepository', () => {
  let reviewRepository: ReviewRepository;
  let reviewModel: Model<Review, ReviewKey>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewRepository,
        {
          provide: getModelToken('Review'),
          useValue: {
            scan: jest.fn(),
            exec: jest.fn(),
            query: jest.fn(),
          },
        },
      ],
    }).compile();

    reviewRepository = module.get<ReviewRepository>(ReviewRepository);
    reviewModel = module.get<Model<Review, ReviewKey>>(getModelToken('Review'));
  });

  it('should find all reviews', async () => {
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

    // Mock the implementation of reviewModel.find().sort().limit().exec()
    (reviewModel.query as jest.Mock).mockReturnValueOnce({
      sort: jest.fn().mockReturnValueOnce({
        limit: jest.fn().mockReturnValueOnce({
          exec: jest.fn().mockResolvedValueOnce(mockReviews),
        }),
      }),
    });

    const result = await reviewRepository.findAll();

    expect(result).toEqual(mockReviews);
    expect(reviewModel.query).toHaveBeenCalled();
  });

  it('should return empty array when no reviews found', async () => {
    // Mock the implementation of reviewModel.query().exec()
    (reviewModel.query as jest.Mock).mockReturnValueOnce({
      sort: jest.fn().mockReturnValueOnce({
        limit: jest.fn().mockReturnValueOnce({
          exec: jest.fn().mockResolvedValueOnce([]),
        }),
      }),
    });

    const result = await reviewRepository.findAll();

    expect(result).toEqual([]);
    expect(reviewModel.query).toHaveBeenCalled();
  });

  // Add more tests as needed
});
