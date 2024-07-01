// Mock the BookService
import { BookResolver } from './book.resolver';
import { Book } from './entities/book.entity';
import { BookStatus } from './enums/book-status';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { BookService } from './book.service';
import { UserService } from '../user/user.service';
import { GenreService } from '../genre/genre.service';
import { NotFoundException } from '@nestjs/common';
import { User } from '../user/entities/user.entity';
import { UserRoles } from '../user/enums/user-role.enum';
import { UserStatus } from '../user/enums/user-status.enum';
import { Genre } from '../genre/entities/genre.entity';
import { UserDetails } from '../user/entities/user-details.entity';
import { ApolloError, UserInputError } from 'apollo-server-express';
import { BookResponse } from './types/book.type';
import { CreateBookInputDto } from './dto/create-book.input.dto';
import { CurrentUserType } from '../user/types/user.type';
import { UpdateBookInputDto } from './dto/update-book.input.dto';
import { QueryPagingBookDto } from './dto/query-paging-book.dto';

describe('BookResolver', () => {
  let bookResolver: BookResolver;
  let mockBookService: {
    findBookById: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    paginate: jest.Mock;
    remove: jest.Mock;
  };
  let mockCacheManager: {
    get: jest.Mock;
    set: jest.Mock;
  };
  const mockConfigService = {
    get: jest.fn().mockReturnValue('600'),
  };

  const createMockBook = (): Book => ({
    id: 1,
    title: 'Test Book',
    description: 'Test Description',
    content: 'Lorem Ipsum is simply dummy text...',
    createdAt: new Date('2024-07-01T16:08:54.759Z'),
    updatedAt: new Date('2024-07-01T16:08:54.759Z'),
    status: BookStatus.PUBLISHED,
    authors: [],
    genres: [],
  });

  beforeEach(async () => {
    mockBookService = {
      findBookById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      paginate: jest.fn(),
      remove: jest.fn(),
    };
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookResolver,
        { provide: BookService, useValue: mockBookService },
        { provide: 'BOOK_CACHE_MANAGER', useValue: mockCacheManager },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: GenreService, useValue: {} },
        { provide: UserService, useValue: {} },
      ],
    }).compile();

    bookResolver = module.get<BookResolver>(BookResolver);
  });

  describe('findOne', () => {
    it('should return a book from cache if available', async () => {
      const mockCachedBook = createMockBook();
      mockCacheManager.get.mockResolvedValueOnce(mockCachedBook);

      const result = await bookResolver.findOne(1);

      expect(result).toEqual(mockCachedBook);
      expect(mockCacheManager.get).toHaveBeenCalledWith('book:1');
      expect(mockBookService.findBookById).not.toHaveBeenCalled();
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });

    it('should fetch a book from the service and cache it if not cached', async () => {
      const mockBook = createMockBook();
      mockCacheManager.get.mockResolvedValueOnce(null);
      mockBookService.findBookById.mockResolvedValueOnce(mockBook);

      const result = await bookResolver.findOne(1);

      expect(result).toEqual(mockBook);
      expect(mockCacheManager.get).toHaveBeenCalledWith('book:1');
      expect(mockBookService.findBookById).toHaveBeenCalledWith(1);
      expect(mockCacheManager.set).toHaveBeenCalledWith('book:1', mockBook);
    });

    it('should throw a NotFoundException if the book is not found', async () => {
      mockCacheManager.get.mockResolvedValueOnce(null);
      mockBookService.findBookById.mockResolvedValueOnce(null);

      await expect(bookResolver.findOne(1)).rejects.toThrow(
        new NotFoundException('Book with id 1 not found'),
      );

      expect(mockCacheManager.get).toHaveBeenCalledWith('book:1');
      expect(mockBookService.findBookById).toHaveBeenCalledWith(1);
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });
  });
  describe('create', () => {
    const userDetails1 = new UserDetails();
    userDetails1.id = 1;
    userDetails1.email = 'some1@test.com';
    userDetails1.password = 'testPassword';
    userDetails1.username = 'testUser';
    userDetails1.fullname = 'John Dou1';
    userDetails1.age = 30;
    userDetails1.createdAt = new Date('2024-07-01T16:08:54.759Z');
    userDetails1.updatedAt = new Date('2024-07-01T16:08:54.759Z');

    const user1 = new User();
    user1.id = 1;
    user1.role = UserRoles.AUTHOR;
    user1.status = UserStatus.ACTIVE;
    user1.createdAt = new Date('2024-07-01T16:08:54.759Z');
    user1.updatedAt = new Date('2024-07-01T16:08:54.759Z');
    user1.details = userDetails1;
    const userDetails2 = new UserDetails();
    userDetails2.id = 2;
    userDetails2.email = 'some1@test.com';
    userDetails2.password = 'testPassword';
    userDetails2.username = 'Yura1';
    userDetails2.fullname = 'John Dou1';
    userDetails2.age = 30;
    userDetails2.createdAt = new Date('2024-07-01T16:08:54.759Z');
    userDetails2.updatedAt = new Date('2024-07-01T16:08:54.759Z');

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
        createdAt: new Date('2024-07-01T16:08:54.759Z'),
        updatedAt: new Date('2024-07-01T16:08:54.759Z'),
      },
      {
        id: 2,
        name: 'Horror',
        description: 'Description genre',
        createdAt: new Date('2024-07-01T16:08:54.759Z'),
        updatedAt: new Date('2024-07-01T16:08:54.759Z'),
      },
    ];
    const createBookInputDto: CreateBookInputDto = {
      title: 'Test Book',
      description: 'Test Description',
      content: 'Test Content',
      authors: [1],
      genres: [1, 2],
    };
    const currentUser: CurrentUserType = {
      id: 1,
      role: UserRoles.AUTHOR,
    };

    it('should call bookService.create with input and currentUser', async () => {
      const result: BookResponse = {
        ...createBookInputDto,
        authors: [currentUser],
        genres: mockGenres,
        id: 1,
        createdAt: new Date('2024-07-01T16:08:54.759Z'),
        updatedAt: new Date('2024-07-01T16:08:54.759Z'),
        status: 'PUBLISHED',
      };

      mockBookService.create.mockResolvedValueOnce(result);

      const response = await bookResolver.create(
        createBookInputDto,
        currentUser,
      );

      expect(response).toEqual(result);
      expect(mockBookService.create).toHaveBeenCalledWith(
        createBookInputDto,
        currentUser,
      );
    });

    it('should handle unknown errors', async () => {
      const error = new Error('Unexpected error');
      mockBookService.create.mockRejectedValueOnce(error);

      await expect(
        bookResolver.create(createBookInputDto, currentUser),
      ).rejects.toThrow(ApolloError);
    });
  });
  describe('update', () => {
    const updateBookInputDto: UpdateBookInputDto = {
      id: 1,
      title: 'Updated Test Book',
      description: 'Updated Test Description',
      content: 'Updated Test Content',
    };

    const currentUser: CurrentUserType = {
      id: 1,
      role: UserRoles.AUTHOR,
    };
    const userDetails1 = new UserDetails();
    userDetails1.id = 1;
    userDetails1.email = 'some1@test.com';
    userDetails1.password = 'testPassword';
    userDetails1.username = 'testUser';
    userDetails1.fullname = 'John Dou1';
    userDetails1.age = 30;
    userDetails1.createdAt = new Date('2024-07-01T16:08:54.759Z');
    userDetails1.updatedAt = new Date('2024-07-01T16:08:54.759Z');

    const user1 = new User();
    user1.id = 1;
    user1.role = UserRoles.AUTHOR;
    user1.status = UserStatus.ACTIVE;
    user1.createdAt = new Date('2024-07-01T16:08:54.759Z');
    user1.updatedAt = new Date('2024-07-01T16:08:54.759Z');
    user1.details = userDetails1;
    const userDetails2 = new UserDetails();
    userDetails2.id = 2;
    userDetails2.email = 'some1@test.com';
    userDetails2.password = 'testPassword';
    userDetails2.username = 'Yura1';
    userDetails2.fullname = 'John Dou1';
    userDetails2.age = 30;
    userDetails2.createdAt = new Date('2024-07-01T16:08:54.759Z');
    userDetails2.updatedAt = new Date('2024-07-01T16:08:54.759Z');

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
        createdAt: new Date('2024-07-01T16:08:54.759Z'),
        updatedAt: new Date('2024-07-01T16:08:54.759Z'),
      },
      {
        id: 1,
        name: 'Fiction',
        description: 'Description genre',
        createdAt: new Date('2024-07-01T16:08:54.759Z'),
        updatedAt: new Date('2024-07-01T16:08:54.759Z'),
      },
    ];

    it('should call bookService.update with input and currentUser for valid request', async () => {
      updateBookInputDto.authors = [1];
      const result: Book = {
        title: 'Some title',
        description: 'Some description',
        content: 'Some content',
        ...updateBookInputDto,
        authors: mockAuthors,
        genres: mockGenres,
        id: 1,
        createdAt: new Date('2024-07-01T16:08:54.759Z'),
        updatedAt: new Date('2024-07-01T16:08:54.759Z'),
        publicationYear: null,
        status: BookStatus.PUBLISHED,
      };

      mockBookService.update.mockResolvedValueOnce(result);

      const response = await bookResolver.update(
        updateBookInputDto,
        currentUser,
      );

      expect(response).toEqual(result);
      expect(mockBookService.update).toHaveBeenCalledWith(
        updateBookInputDto,
        currentUser,
      );
    });

    it('should handle unknown errors', async () => {
      const error = new Error('Unexpected error');
      mockBookService.update.mockRejectedValueOnce(error);

      await expect(
        bookResolver.update(updateBookInputDto, currentUser),
      ).rejects.toThrow(ApolloError);
    });
  });

  describe('getAllBooksWithPaging', () => {
    it('should return book pagination', async () => {
      const queryPagingDto: QueryPagingBookDto = {
        page: 1,
        limit: 10,
        filters: {},
      };

      const mockPaginationResult = {
        edges: [
          {
            cursor: 'cursor1',
            node: {
              id: 1,
              title: 'Test Book',
              description: 'A description',
              content: 'Some content',
              status: 'published',
              genres: [],
              authors: [],
              createdAt: new Date('2024-07-01T13:44:13.508Z'),
              updatedAt: new Date('2024-07-01T13:44:13.508Z'),
            },
          },
        ],
        pageInfo: {
          endCursor: 'cursor1',
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'cursor1',
        },
        total: 1,
      };

      mockBookService.paginate.mockResolvedValue(mockPaginationResult);

      const result = await bookResolver.getAllBooksWithPaging(queryPagingDto);

      // Assertions
      expect(result).toEqual(mockPaginationResult);
      expect(mockBookService.paginate).toHaveBeenCalledWith(
        { page: queryPagingDto.page, limit: queryPagingDto.limit },
        queryPagingDto.filters,
      );
    });
  });

  describe('remove', () => {
    const userDetails1 = new UserDetails();
    userDetails1.id = 1;
    userDetails1.email = 'some1@test.com';
    userDetails1.password = 'testPassword';
    userDetails1.username = 'testUser';
    userDetails1.fullname = 'John Dou1';
    userDetails1.age = 30;
    userDetails1.createdAt = new Date('2024-07-01T13:44:13.508Z');
    userDetails1.updatedAt = new Date('2024-07-01T13:44:13.508Z');

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
    userDetails2.createdAt = new Date('2024-07-01T13:44:13.508Z');
    userDetails2.updatedAt = new Date('2024-07-01T13:44:13.508Z');

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
        createdAt: new Date('2024-07-01T13:44:13.508Z'),
        updatedAt: new Date('2024-07-01T13:44:13.508Z'),
      },
      {
        id: 1,
        name: 'Fiction',
        description: 'Description genre',
        createdAt: new Date('2024-07-01T13:44:13.508Z'),
        updatedAt: new Date('2024-07-01T13:44:13.508Z'),
      },
    ];
    it('should remove a book successfully', async () => {
      const mockBook: Book = {
        id: 1,
        title: 'Test Book',
        description: 'Test Description',
        content: 'Test Content',
        authors: mockAuthors,
        genres: mockGenres,
        createdAt: new Date('2024-07-01T13:44:13.508Z'),
        updatedAt: new Date('2024-07-01T13:44:13.508Z'),
        status: BookStatus.ARCHIVED,
      };

      mockBookService.remove.mockResolvedValueOnce(mockBook);

      const result = await bookResolver.remove(1);

      expect(result).toEqual(mockBook);
      expect(mockBookService.remove).toHaveBeenCalledWith(1);
    });

    it('should handle known errors', async () => {
      const error = new UserInputError('Invalid input');
      mockBookService.remove.mockRejectedValueOnce(error);

      await expect(bookResolver.remove(1)).rejects.toThrow(UserInputError);
    });

    it('should handle unknown errors', async () => {
      const error = new Error('Unexpected error');
      mockBookService.remove.mockRejectedValueOnce(error);

      await expect(bookResolver.remove(1)).rejects.toThrow(ApolloError);
    });
  });
});
