import { Test, TestingModule } from '@nestjs/testing';
import { BookService } from './book.service';
import { Book } from './entities/book.entity';
import { GenreService } from '../genre/genre.service';
import { SqsService } from '../sqs/sqs.service';
import { UserService } from '../user/user.service';
import { BookRepository } from './book.repository';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';
import { CreateBookInputDto } from './dto/create-book.input.dto';
import { CurrentUserType } from '../user/types/user.type';
import { UserRoles } from '../user/enums/user-role.enum';
import { InternalServerErrorException } from '@nestjs/common';
jest.mock('nestjs-typeorm-paginate');
describe('BookService', () => {
  let bookService: BookService;
  let mockBookRepository: BookRepository;
  let genreService: GenreService;
  let userService: UserService;
  let sqsService: SqsService;

  beforeEach(async () => {
    mockBookRepository = {
      createAndSaveBook: jest.fn().mockImplementation((bookData) => {
        const createdBook = new Book();
        return Promise.resolve(createdBook);
      }),
      paginateBooks: jest.fn(),
    } as unknown as BookRepository;
    sqsService = {
      sendMessage: jest.fn().mockResolvedValue(undefined),
    } as any;

    bookService = new BookService(
      mockBookRepository,
      sqsService,
      genreService,
      userService,
    );

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BookService,
        {
          provide: BookRepository,
          useValue: mockBookRepository,
        },
        {
          provide: GenreService,
          useValue: {
            findGenresByIds: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            findUsersByIds: jest.fn(),
            getUserById: jest.fn(),
          },
        },
        {
          provide: SqsService,
          useValue: {
            sendMessage: jest.fn(),
          },
        },
      ],
    }).compile();

    bookService = moduleRef.get<BookService>(BookService);
    genreService = moduleRef.get<GenreService>(GenreService);
    userService = moduleRef.get<UserService>(UserService);
    sqsService = moduleRef.get<SqsService>(SqsService);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should paginate books correctly', async () => {
    const options: IPaginationOptions = { page: 1, limit: 10 };
    const filters = {};

    // Mock the call to paginateBooks
    (mockBookRepository.paginateBooks as jest.Mock).mockResolvedValueOnce({
      items: [
        { id: 1, title: 'Book 1' },
        { id: 2, title: 'Book 2' },
      ],
      meta: {
        totalItems: 20,
        itemCount: 2,
        itemsPerPage: 10,
        totalPages: 2,
        currentPage: 1,
      },
    });

    const result = await bookService.paginate(options, filters);

    expect(result).toEqual({
      edges: [
        { node: { id: 1, title: 'Book 1' }, cursor: '1' },
        { node: { id: 2, title: 'Book 2' }, cursor: '2' },
      ],
      pageInfo: {
        startCursor: '1',
        endCursor: '2',
        hasNextPage: true,
        hasPreviousPage: false,
      },
      total: 20,
    });

    expect(mockBookRepository.paginateBooks).toHaveBeenCalledWith(
      options,
      filters,
    );
  });

  it('should throw an error if pagination options are invalid', async () => {
    const options = { page: NaN, limit: NaN };

    await expect(bookService.paginate(options)).rejects.toThrow(
      'Failed to get books from DB',
    );
  });
  describe('create', () => {
    it('should create a book correctly', async () => {
      const createBookInputDto: CreateBookInputDto = {
        title: 'Test Book',
        description: 'Test Description',
        content: 'Test Content',
        genres: [1, 2],
        authors: [1, 2],
      };

      const currentUser: CurrentUserType = {
        id: 1,
        role: UserRoles.ADMIN, // Replace with appropriate role from your enum
      };

      // Mock the sendCreateMessage method
      const sendCreateMessageSpy = jest
        .spyOn(bookService as any, 'sendCreateMessage')
        .mockResolvedValueOnce(undefined);

      // Mock the createAndSaveBook method
      (mockBookRepository.createAndSaveBook as jest.Mock).mockResolvedValueOnce(
        {
          id: 1,
          ...createBookInputDto,
        },
      );

      const result = await bookService.create(createBookInputDto, currentUser);

      expect(result).toEqual({
        id: 1,
        ...createBookInputDto,
      });

      expect(sendCreateMessageSpy).toHaveBeenCalledWith(currentUser.id);
    });

    it('should throw InternalServerErrorException on failure', async () => {
      const createBookInputDto: CreateBookInputDto = {
        title: 'Test Book',
        description: 'Test Description',
        content: 'Test Content', // Include content property
        genres: [1, 2], // Mocked values for testing
        authors: [1, 2], // Mocked values for testing
      };
      const currentUser = { id: 1, role: UserRoles.AUTHOR }; // Mocked currentUser for testing

      // Mock findGenresByIds to throw an error
      (genreService.findGenresByIds as jest.Mock).mockRejectedValueOnce(
        new Error('Genre lookup failed'),
      );

      // Call create method and expect it to throw InternalServerErrorException
      await expect(
        bookService.create(createBookInputDto, currentUser),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
