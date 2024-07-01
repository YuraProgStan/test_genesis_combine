import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Book } from './entities/book.entity';
import {
  Inject,
  NotFoundException,
  ParseIntPipe,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { BookService } from './book.service';
import { CreateBookInputDto } from './dto/create-book.input.dto';
import { UpdateBookInputDto } from './dto/update-book.input.dto';
import { BookPagination } from './types/book.type';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../user/decorators/users.decorator';
import { ApolloError, UserInputError } from 'apollo-server-express';
import { BookCacheService } from '../cache/book/book-cache.service';
import { BookCreateValidationPipe } from './pipes/book-create-validation.pipe';
import { BookUpdateValidationPipe } from './pipes/book-update-validation.pipe';
import { QueryPagingBookDto } from './dto/query-paging-book.dto';
import { CurrentUserType } from '../user/types/user.type';

@Resolver()
export class BookResolver {
  constructor(
    private bookService: BookService,
    @Inject('BOOK_CACHE_MANAGER')
    private cacheManager: BookCacheService,
  ) {}

  @Query(() => BookPagination, { name: 'findAllBooks' })
  async getAllBooksWithPaging(
    @Args('queryPagingDto') queryPagingDto: QueryPagingBookDto,
  ): Promise<BookPagination> {
    const { page, limit, filters } = queryPagingDto;
    const cacheKey = `books:${page}:${limit}:${JSON.stringify(filters)}`;

    const cachedBooks = await this.cacheManager.get(cacheKey);
    if (cachedBooks) {
      cachedBooks.edges = cachedBooks.edges.map((edge) => {
        return { ...edge, node: this.convertDateFieldsForBook(edge.node) };
      });
      return cachedBooks;
    }

    const pagination = await this.bookService.paginate(
      { page, limit },
      filters,
    );

    await this.cacheManager.set(cacheKey, pagination);

    return pagination;
  }

  @Query(() => Book, { name: 'book' })
  async findOne(@Args('id', { type: () => ID }) id: number): Promise<Book> {
    const cacheKey = `book:${id}`;
    const cachedBook = await this.cacheManager.get(cacheKey);
    if (cachedBook) {
      const cachedBookWithDateFormat: Book =
        this.convertDateFieldsForBook(cachedBook);
      return cachedBookWithDateFormat;
    }
    const book = await this.bookService.findBookById(id);
    if (!book) {
      throw new NotFoundException(`Book with id ${id} not found`);
    }

    await this.cacheManager.set(cacheKey, book);
    return book;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor', 'author')
  @UsePipes(BookCreateValidationPipe)
  @Mutation(() => Book, { name: 'createBook' })
  async create(
    @Args('createBookInputDto') createBookInputDto: CreateBookInputDto,
    @CurrentUser() currentUser: CurrentUserType,
  ): Promise<Book> {
    try {
      return await this.bookService.create(createBookInputDto, currentUser);
    } catch (error) {
      throw new ApolloError(
        'An unexpected error occurred',
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor', 'author')
  @UsePipes(BookUpdateValidationPipe)
  @Mutation(() => Book, { name: 'updateBook' })
  async update(
    @Args('updateBookInputDto')
    updateBookInputDto: UpdateBookInputDto,
    @CurrentUser() currentUser: CurrentUserType,
  ): Promise<Book> {
    try {
      return await this.bookService.update(updateBookInputDto, currentUser);
    } catch (error) {
      throw new ApolloError(
        'An unexpected error occurred',
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor', 'author')
  @UseGuards(JwtAuthGuard)
  @Mutation(() => Book, { name: 'removeBook' })
  async remove(@Args('id', ParseIntPipe) id: number): Promise<Book> {
    try {
      return await this.bookService.remove(id);
    } catch (error) {
      if (error instanceof ApolloError || error instanceof UserInputError) {
        throw error;
      } else {
        throw new ApolloError(
          'An unexpected error occurred',
          'INTERNAL_SERVER_ERROR',
        );
      }
    }
  }

  private convertDateFieldsForBook(book: Book): Book {
    const newBook: Book = JSON.parse(JSON.stringify(book)); // Clone the original book

    newBook.createdAt = new Date(book.createdAt);
    newBook.updatedAt = new Date(book.updatedAt);

    newBook.genres = book.genres.map((genre) => ({
      ...genre,
      createdAt: new Date(genre.createdAt),
      updatedAt: new Date(genre.updatedAt),
    }));

    newBook.authors = book.authors.map((author) => ({
      ...author,
      createdAt: new Date(author.createdAt),
      updatedAt: new Date(author.updatedAt),
      details: {
        ...author.details,
        createdAt: new Date(author.details.createdAt),
        updatedAt: new Date(author.details.updatedAt),
      },
    }));

    return newBook;
  }
}
