// Mock the BookService
import { BookResolver } from './book.resolver';
import { BookPagination, BookResponse } from './types/book.type';
import { Book } from './entities/book.entity';
import { BookStatus } from './enums/book-status';
import { UserDetails } from '../user/enitites/user-details.entity';
import { User } from '../user/enitites/user.entity';
import { UserRoles } from '../user/enums/user-role.enum';
import { UserStatus } from '../user/enums/user-status.enum';
import { Genre } from '../genre/entities/genre.entity';
import { ApolloError, UserInputError } from 'apollo-server-express';
import { CreateBookInputDto } from './dto/create-book.input.dto';
import { UserWithDetailsWithoutPassword } from '../auth/types/auth.type';
import { UpdateBookInputDto } from './dto/update-book.input.dto';

const mockBookService = {
  paginate: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

// Mock the BookCacheService
const mockBookCacheService = {
  get: jest.fn(),
  set: jest.fn(),
};

describe('BookResolver', () => {
  let bookResolver: BookResolver;

  beforeAll(() => {
    // Create an instance of the resolver with mocked dependencies
    bookResolver = new BookResolver(
      mockBookService as any,
      mockBookCacheService as any,
    );
  });
  describe('getAllBooksWithPaging', () => {
    it('should return book pagination', async () => {
      // Mock the return value of the paginate method
      const mockPaginationResult: BookPagination = {
        edges: [],
        pageInfo: {
          startCursor: null,
          endCursor: null,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        total: 0,
      };
      mockBookService.paginate.mockResolvedValueOnce({
        ...mockPaginationResult,
        meta: {
          totalItems: 0,
          totalPages: 1,
        },
        items: [],
      });

      // Call the resolver method
      const result = await bookResolver.getAllBooksWithPaging(1, 10);

      // Assertions
      expect(result).toEqual(mockPaginationResult);
      expect(mockBookService.paginate).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        undefined,
      );
    });
  });

  describe('findOne', () => {
    beforeEach(() => {
      mockBookService.findOne.mockClear();
    });
    it('should return a book', async () => {
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
      const mockBook: Book = {
        authors: mockAuthors,
        genres: mockGenres,
        id: 1,
        title: 'Test Book',
        description: 'Test Description',
        content: 'Lorem Ipsum is simply dummy text...',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: BookStatus.PUBLISHED,
      };
      mockBookService.findOne.mockResolvedValueOnce(mockBook);

      mockBookCacheService.get.mockResolvedValueOnce(null);

      const result = await bookResolver.findOne(1);

      // Assertions
      expect(result).toEqual(mockBook);
      expect(mockBookService.findOne).toHaveBeenCalledWith(1);
      expect(mockBookCacheService.get).toHaveBeenCalledWith('book:1');
      expect(mockBookCacheService.set).toHaveBeenCalledWith('book:1', mockBook);
    });

    it('should return a book from cache if available', async () => {
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
      const mockBook: Book = {
        authors: mockAuthors,
        genres: mockGenres,
        id: 1,
        title: 'Test Book',
        description: 'Test Description',
        content: 'Lorem Ipsum is simply dummy text...',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: BookStatus.PUBLISHED,
      };
      mockBookCacheService.get.mockResolvedValueOnce(mockBook);

      // Call the resolver method
      const result = await bookResolver.findOne(1);

      // Assertions
      expect(result).toEqual(mockBook);
      expect(mockBookService.findOne).not.toHaveBeenCalled();
      expect(mockBookCacheService.get).toHaveBeenCalledWith('book:1');
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
    const createBookInputDto: CreateBookInputDto = {
      title: 'Test Book',
      description: 'Test Description',
      content: 'Test Content',
      authors: [1],
      genres: [],
    };
    const currentUser: UserWithDetailsWithoutPassword = {
      id: 1,
      details: {
        username: 'testUser',
      },
    };

    it('should add current user as the only author if currentUser is AUTHOR', async () => {
      const createBookInputDto: CreateBookInputDto = {
        title: 'Test Book',
        description: 'Test Description',
        content: 'Test Content',
        authors: [1],
        genres: [1, 2],
      };
      const result: BookResponse = {
        ...createBookInputDto,
        authors: [currentUser],
        genres: mockGenres,
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: BookStatus.DRAFT,
      };

      mockBookService.create.mockResolvedValueOnce(result);

      const response = await bookResolver.create(
        createBookInputDto,
        currentUser,
      );

      expect(response).toEqual(result);
      expect(mockBookService.create).toHaveBeenCalledWith(
        { ...createBookInputDto, authors: [currentUser.id] },
        currentUser,
      );
    });

    it('should add current user as author if no authors provided and currentUser is ADMIN or EDITOR', async () => {
      const adminUser = { ...currentUser, role: UserRoles.ADMIN };

      const result: BookResponse = {
        ...createBookInputDto,
        authors: [adminUser],
        genres: mockGenres,
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'PUBLISHED',
      };

      mockBookService.create.mockResolvedValueOnce(result);

      const response = await bookResolver.create(createBookInputDto, adminUser);

      expect(response).toEqual(result);
      expect(mockBookService.create).toHaveBeenCalledWith(
        { ...createBookInputDto, authors: [adminUser.id] },
        adminUser,
      );
    });

    it('should call bookService.create with input and currentUser', async () => {
      const result: BookResponse = {
        ...createBookInputDto,
        authors: [currentUser],
        genres: mockGenres,
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
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

    it('should handle known errors', async () => {
      const error = new UserInputError('Invalid input');
      mockBookService.create.mockRejectedValueOnce(error);

      await expect(
        bookResolver.create(createBookInputDto, currentUser),
      ).rejects.toThrow(UserInputError);
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
      title: 'Updated Test Book',
      description: 'Updated Test Description',
      content: 'Updated Test Content',
    };

    const currentUser: UserWithDetailsWithoutPassword = {
      id: 1,
      role: UserRoles.AUTHOR,
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

    it('should throw an error if current user is AUTHOR and tries to add multiple authors', async () => {
      updateBookInputDto.authors = [1, 2];

      await expect(
        bookResolver.update(1, updateBookInputDto, currentUser),
      ).rejects.toThrow(ApolloError);
      expect(mockBookService.update).not.toHaveBeenCalled();
    });

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
        createdAt: new Date(),
        updatedAt: new Date(),
        publicationYear: null,
        status: BookStatus.PUBLISHED,
      };

      mockBookService.update.mockResolvedValueOnce(result);

      const response = await bookResolver.update(
        1,
        updateBookInputDto,
        currentUser,
      );

      expect(response).toEqual(result);
      expect(mockBookService.update).toHaveBeenCalledWith(
        1,
        updateBookInputDto,
        currentUser,
      );
    });

    it('should handle known errors', async () => {
      const error = new UserInputError('Invalid input');
      mockBookService.update.mockRejectedValueOnce(error);

      await expect(
        bookResolver.update(1, updateBookInputDto, currentUser),
      ).rejects.toThrow(UserInputError);
    });

    it('should handle unknown errors', async () => {
      const error = new Error('Unexpected error');
      mockBookService.update.mockRejectedValueOnce(error);

      await expect(
        bookResolver.update(1, updateBookInputDto, currentUser),
      ).rejects.toThrow(ApolloError);
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
    it('should remove a book successfully', async () => {
      const mockBook: Book = {
        id: 1,
        title: 'Test Book',
        description: 'Test Description',
        content: 'Test Content',
        authors: mockAuthors,
        genres: mockGenres,
        createdAt: new Date(),
        updatedAt: new Date(),
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
