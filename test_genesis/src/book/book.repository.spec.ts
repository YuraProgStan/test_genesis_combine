import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BookRepository } from './book.repository';
import { Book } from './entities/book.entity';
import { Repository } from 'typeorm';
import { BookStatus } from './enums/book-status';
import { User } from '../user/entities/user.entity';
import { UserDetails } from '../user/entities/user-details.entity';
import { Genre } from '../genre/entities/genre.entity';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';

jest.mock('nestjs-typeorm-paginate', () => ({
  paginate: jest.fn(),
}));
describe('BookRepository', () => {
  let repository: BookRepository;
  let findOneSpy: jest.SpyInstance;
  let createSpy: jest.SpyInstance;
  let saveSpy: jest.SpyInstance;
  let updateSpy: jest.SpyInstance;
  const mockQuery = jest.fn();

  const mockQueryBuilder: any = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    offset: jest.fn().mockReturnThis(), // Mock offset method
    limit: jest.fn().mockReturnThis(),
    relation: jest.fn().mockReturnThis(),
    of: jest.fn().mockReturnThis(),
    addAndRemove: jest.fn().mockReturnThis(),
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookRepository,
        {
          provide: getRepositoryToken(Book),
          useClass: Repository, // Use actual TypeORM Repository class
        },
      ],
    }).compile();

    repository = module.get<BookRepository>(BookRepository);
    findOneSpy = jest.spyOn(repository, 'findOne');
    createSpy = jest.spyOn(repository, 'create');
    saveSpy = jest.spyOn(repository, 'save');
    updateSpy = jest.spyOn(repository, 'update');
    jest
      .spyOn(repository, 'createQueryBuilder')
      .mockReturnValue(mockQueryBuilder);
    jest.spyOn(repository, 'query').mockImplementation(mockQuery);
    jest.spyOn(repository as any, 'applyFilters').mockImplementation();
    jest.spyOn(repository as any, 'applyPaginationOptions');
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks after each test
  });

  describe('findOneWithRelationsAuthors', () => {
    it('should find a book with authors relations', async () => {
      const mockBookId = 1;
      const mockBook = {
        id: mockBookId,
        title: 'Mock Book',
        authors: [
          { id: 1, name: 'Author 1' },
          { id: 2, name: 'Author 2' },
        ],
      };

      // Use type assertion to convert mockBook to unknown first
      findOneSpy.mockResolvedValueOnce(mockBook as unknown as Book);

      const result = await repository.findOneWithRelationsAuthors(mockBookId);

      expect(result).toEqual(mockBook);

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: mockBookId },
        relations: ['authors'],
      });
    });

    it('should return undefined if book with given id is not found', async () => {
      const mockBookId = 999;

      findOneSpy.mockResolvedValueOnce(undefined);

      const result = await repository.findOneWithRelationsAuthors(mockBookId);

      expect(result).toBeUndefined();

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: mockBookId },
        relations: ['authors'],
      });
    });
  });

  describe('findOneWithRelations', () => {
    it('should find a book with all relations', async () => {
      const mockBookId = 1;
      const mockBook = {
        id: mockBookId,
        title: 'Mock Book',
        genres: [
          { id: 1, name: 'Fiction' },
          { id: 2, name: 'Fantasy' },
        ],
        authors: [{ id: 1, details: { id: 1, username: 'Author1' } }],
      };

      findOneSpy.mockResolvedValueOnce(mockBook as unknown as Book);

      const result = await repository.findOneWithRelations(mockBookId);

      expect(result).toEqual(mockBook);

      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: mockBookId },
        relations: ['genres', 'authors', 'authors.details'],
      });
    });

    it('should return undefined if book with given id is not found', async () => {
      const mockBookId = 999;

      findOneSpy.mockResolvedValueOnce(undefined);

      const result = await repository.findOneWithRelations(mockBookId);

      expect(result).toBeUndefined();
      expect(findOneSpy).toHaveBeenCalledWith({
        where: { id: mockBookId },
        relations: ['genres', 'authors', 'authors.details'],
      });
    });
  });
  describe('updateBookById', () => {
    it('should update a book by ID', async () => {
      const bookId = 1;
      const bookData = {
        title: 'Updated Title',
        description: 'Updated Description',
        content: 'Updated Content',
      };

      updateSpy.mockResolvedValueOnce(bookData);

      // Call the repository method being tested
      await repository.updateBookById(bookId, bookData);

      // Assert that the update method was called with correct parameters
      expect(updateSpy).toHaveBeenCalledWith(bookId, bookData);
    });
  });
  describe('updateGenresByBookId', () => {
    it('should update genres by book ID', async () => {
      const bookId = 1;
      const genresIds = [1, 2, 3];
      const existingGenreIds = [2, 3, 4];

      // Call the repository method being tested
      await repository.updateGenresByBookId(
        bookId,
        genresIds,
        existingGenreIds,
      );

      // Assert that createQueryBuilder was called
      expect(repository.createQueryBuilder).toHaveBeenCalled();

      // Assert that relation method was called with correct parameters
      expect(mockQueryBuilder.relation).toHaveBeenCalledWith(Book, 'genres');

      // Assert that of method was called with correct parameters
      expect(mockQueryBuilder.of).toHaveBeenCalledWith(bookId);

      // Assert that addAndRemove method was called with correct parameters
      expect(mockQueryBuilder.addAndRemove).toHaveBeenCalledWith(
        genresIds,
        [4], // existingGenreIds that are not in genresIds
      );
    });
  });

  describe('createAndSaveBook', () => {
    it('should create and save a book', async () => {
      const mockBookUpdated: Partial<Book> = {
        title: 'Mock Book',
        description: 'Mock Description',
        content: 'Mock Content',
        genres: [
          {
            id: 1,
            name: 'Fiction',
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Genre,
        ],
        authors: [
          {
            id: 1,
            details: {
              id: 1,
              email: 'author@example.com',
              password: 'password',
              fullname: 'Author Name',
              username: 'Cool author',
              createdAt: new Date(),
              updatedAt: new Date(),
            } as UserDetails,
          } as User,
        ],
      };

      const mockSavedBook: Book = {
        id: 1,
        ...mockBookUpdated,
        status: BookStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Book;

      // Mock the create method to return a book instance
      createSpy.mockReturnValueOnce(mockSavedBook as unknown as Book);

      // Mock the save method to return the saved book
      saveSpy.mockResolvedValueOnce(mockSavedBook);

      // Call the repository method being tested
      const result = await repository.createAndSaveBook(mockBookUpdated);

      // Assert that the result matches the expected saved book
      expect(result).toEqual(mockSavedBook);
      // Assert that create method was called with correct parameters
      expect(createSpy).toHaveBeenCalledWith(mockBookUpdated);
      // Assert that save method was called with the created book instance
      expect(saveSpy).toHaveBeenCalledWith(mockSavedBook);
    });
  });
  describe('updateBookStatusByUserIdForOneAuthorWhichSoftDeleted', () => {
    it('should update the book status for a user who is the only author and is soft deleted', async () => {
      const userId = 1;
      const query = `
        UPDATE book
        SET status = 'archived'
        FROM book_authors_user AS ba
        JOIN "user" AS u ON u.id = ba."userId"
        WHERE ba."bookId" = book.id
        AND u.id = $1
        AND (
            SELECT COUNT(*)
            FROM book_authors_user
            WHERE "bookId" = book.id
        ) = 1
    `;

      // Call the repository method being tested
      await repository.updateBookStatusByUserIdForOneAuthorWhichSoftDeleted(
        userId,
      );

      // Assert that the query method was called with correct parameters
      expect(repository.query).toHaveBeenCalledWith(query, [userId]);
    });
  });
  describe('paginateBooks', () => {
    it('should paginate books with default filters', async () => {
      const options: IPaginationOptions = { page: 1, limit: 10 };
      const filters = {};

      const mockPaginateResult: Pagination<Book> = {
        items: [],
        links: {},
        meta: {
          itemCount: 0,
          totalItems: 0,
          itemsPerPage: 10,
          totalPages: 0,
          currentPage: 1,
        },
      };

      (paginate as jest.Mock).mockResolvedValue(mockPaginateResult);

      const result = await repository.paginateBooks(options, filters);

      expect(result).toEqual(mockPaginateResult);
      expect(repository.createQueryBuilder).toHaveBeenCalledWith('book');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'book.authors',
        'author',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'author.details',
        'details',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'book.genres',
        'genre',
      );
      expect(paginate).toHaveBeenCalledWith(mockQueryBuilder, options);
    });

    it('should paginate books with provided filters', async () => {
      const options: IPaginationOptions = { page: 1, limit: 10 };
      const filters = { status: BookStatus.DRAFT };

      const mockPaginateResult: Pagination<Book> = {
        items: [],
        links: {},
        meta: {
          itemCount: 0,
          totalItems: 0,
          itemsPerPage: 10,
          totalPages: 0,
          currentPage: 1,
        },
      };

      (paginate as jest.Mock).mockResolvedValue(mockPaginateResult);

      const result = await repository.paginateBooks(options, filters);

      expect(result).toEqual(mockPaginateResult);
      expect(repository.createQueryBuilder).toHaveBeenCalledWith('book');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'book.authors',
        'author',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'author.details',
        'details',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'book.genres',
        'genre',
      );
      expect(paginate).toHaveBeenCalledWith(mockQueryBuilder, options);
    });
  });
});
