import { Test, TestingModule } from '@nestjs/testing';
import { BookService } from './book.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserInputError } from 'apollo-server-express';
import { Book } from './entities/book.entity';
import { GenreService } from '../genre/genre.service';
import { SqsService } from '../sqs/sqs.service';
import { UserService } from '../user/user.service';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { BookStatus } from './enums/book-status';
import { UserWithDetailsWithoutPassword } from '../auth/types/auth.type';
import { CreateBookInputDto } from './dto/create-book.input.dto';
import { User } from '../user/enitites/user.entity';
import { Genre } from '../genre/entities/genre.entity';
import { UserDetails } from '../user/enitites/user-details.entity';
import { UserRoles } from '../user/enums/user-role.enum';
import { UserStatus } from '../user/enums/user-status.enum';
jest.mock('nestjs-typeorm-paginate');

describe('BookService', () => {
  let bookService: BookService;
  let bookRepository;
  let genreService: GenreService;
  let userService: UserService;
  let sqsService: SqsService;

  beforeEach(async () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      cache: jest.fn().mockReturnThis(),
      clone: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };

    bookRepository = {
      createQueryBuilder: jest.fn(() => mockQueryBuilder),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BookService,
        {
          provide: getRepositoryToken(Book),
          useValue: bookRepository,
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
  describe('paginate', () => {
    it('should paginate books', async () => {
      const options = { page: 1, limit: 10 };
      const filters = { title: 'test' };

      const mockPaginatedResult: Pagination<Book> = {
        items: [new Book()],
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      };

      (paginate as jest.Mock).mockResolvedValue(mockPaginatedResult);

      const result = await bookService.paginate(options, filters);

      expect(bookRepository.createQueryBuilder).toHaveBeenCalledWith('book');
      expect(paginate).toHaveBeenCalledWith(expect.any(Object), options);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should throw an error if pagination options are invalid', async () => {
      const options = { page: NaN, limit: NaN };

      await expect(bookService.paginate(options)).rejects.toThrow(
        'Failed to get books from DB',
      );
    });

    it('should handle errors and throw InternalServerErrorException', async () => {
      const options = { page: 1, limit: 10 };
      jest
        .spyOn(bookRepository, 'createQueryBuilder')
        .mockImplementation(() => {
          throw new Error('Some DB error');
        });

      await expect(bookService.paginate(options)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('create', () => {
    const createBookInputDto: CreateBookInputDto = {
      title: 'Test Book',
      description: 'Test Description',
      content: 'Lorem Ipsum is simply dummy text...',
      genres: [1, 2],
      authors: [1, 2],
    };
    const currentUser: UserWithDetailsWithoutPassword = {
      id: 1,
      details: {
        username: 'testUser',
      },
    };
    const userDetails1 = new UserDetails();
    userDetails1.id = 1;
    userDetails1.email = 'some1@test.com';
    userDetails1.password = 'testPassword';
    userDetails1.username = 'testUser';
    userDetails1.fullname = 'John Dou1';
    userDetails1.age = 30;
    userDetails1.createdAt = new Date();
    userDetails1.updatedAt = new Date();

    const user1 = new User();
    user1.id = 1;
    user1.role = UserRoles.AUTHOR;
    user1.status = UserStatus.ACTIVE;
    user1.createdAt = new Date();
    user1.updatedAt = new Date();
    user1.details = userDetails1;
    const userDetails2 = new UserDetails();
    userDetails2.id = 2;
    userDetails2.email = 'some1@test.com';
    userDetails2.password = 'testPassword';
    userDetails2.username = 'Yura1';
    userDetails2.fullname = 'John Dou1';
    userDetails2.age = 30;
    userDetails2.createdAt = new Date();
    userDetails2.updatedAt = new Date();

    const user2 = new User();
    user2.id = 2;
    user2.role = UserRoles.AUTHOR;
    user2.status = UserStatus.ACTIVE;
    user2.createdAt = new Date();
    user2.updatedAt = new Date();
    user2.details = userDetails2;
    const mockAuthors: User[] = [user1, user2];

    const mockGenres: Genre[] = [
      {
        id: 1,
        name: 'Fiction',
        description: 'Description genre',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 1,
        name: 'Fiction',
        description: 'Description genre',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    const mockBook = {
      id: 1,
      ...createBookInputDto,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: BookStatus.DRAFT,
      authors: mockAuthors,
      genres: mockGenres,
    };

    it('should create a book successfully', async () => {
      jest.spyOn(bookRepository, 'create').mockReturnValue(mockBook as any);
      jest.spyOn(bookRepository, 'save').mockResolvedValue(mockBook as Book);
      jest.spyOn(genreService, 'findGenresByIds').mockResolvedValue(mockGenres);
      jest.spyOn(userService, 'findUsersByIds').mockResolvedValue(mockAuthors); // Ensure mockAuthors are returned here
      jest.spyOn(sqsService, 'sendMessage').mockResolvedValue(undefined);

      const result = await bookService.create(createBookInputDto, currentUser);

      expect(result).toEqual({
        ...mockBook,
        authors: mockAuthors.map((author) => ({
          username: author.details.username,
          id: author.id,
        })), // Map authors to the expected format
      });
    });
    it('should throw UserInputError if genres not found', async () => {
      jest.spyOn(bookRepository, 'create').mockReturnValue(mockBook as any);
      jest.spyOn(bookRepository, 'save').mockResolvedValue(mockBook as Book);
      jest.spyOn(userService, 'findUsersByIds').mockResolvedValue(mockAuthors);
      jest.spyOn(sqsService, 'sendMessage').mockResolvedValue(undefined);
      jest.spyOn(genreService, 'findGenresByIds').mockResolvedValue([]);

      await expect(
        async () => await bookService.create(createBookInputDto, currentUser),
      ).rejects.toThrow(UserInputError);
    });

    it('should throw UserInputError if authors not found', async () => {
      jest.spyOn(bookRepository, 'create').mockReturnValue(mockBook as any);
      jest.spyOn(bookRepository, 'save').mockResolvedValue(mockBook as Book);
      jest.spyOn(userService, 'findUsersByIds').mockResolvedValue([]);
      jest.spyOn(sqsService, 'sendMessage').mockResolvedValue(undefined);
      jest.spyOn(genreService, 'findGenresByIds').mockResolvedValue(mockGenres);

      await expect(
        bookService.create(createBookInputDto, currentUser),
      ).rejects.toThrow(UserInputError);
    });

    it('should throw InternalServerErrorException on save failure', async () => {
      jest.spyOn(bookRepository, 'create').mockReturnValue(mockBook as any);
      jest.spyOn(userService, 'findUsersByIds').mockResolvedValue(mockAuthors);
      jest.spyOn(sqsService, 'sendMessage').mockResolvedValue(undefined);
      jest.spyOn(genreService, 'findGenresByIds').mockResolvedValue(mockGenres);
      jest
        .spyOn(bookRepository, 'save')
        .mockRejectedValue(new Error('DB Error'));

      await expect(
        bookService.create(createBookInputDto, currentUser),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
