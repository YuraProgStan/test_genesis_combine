import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Book } from './entities/book.entity';
import {
  DefaultValuePipe,
  ForbiddenException,
  Inject,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { BookService } from './book.service';
import { CreateBookInputDto } from './dto/create-book.input.dto';
import { UpdateBookInputDto } from './dto/update-book.input.dto';
import { BookFilters, BookPagination, BookResponse } from './types/book.type';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../user/decorators/users.decorator';
import { User } from '../user/enitites/user.entity';
import { ApolloError, UserInputError } from 'apollo-server-express';
import { UserRoles } from '../user/enums/user-role.enum';
import { BookCacheService } from '../cache/book/book-cache.service';
import { UserWithDetailsWithoutPassword } from '../auth/types/auth.type';

@Resolver()
export class BookResolver {
  constructor(
    private bookService: BookService,
    @Inject('BOOK_CACHE_MANAGER')
    private cacheManager: BookCacheService,
  ) {}
  @Query(() => BookPagination, { name: 'findAllBooks' })
  async getAllBooksWithPaging(
    @Args('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Args('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Args('filters', { nullable: true }) filters?: BookFilters,
  ): Promise<BookPagination> {
    const cacheKey = `books:${page}:${limit}:${JSON.stringify(filters)}`;

    const cachedBooks = await this.cacheManager.get(cacheKey);
    if (cachedBooks) {
      return cachedBooks;
    }

    const { items, meta } = await this.bookService.paginate(
      { page, limit },
      filters,
    );

    const startCursor = items.length > 0 ? items[0].id.toString() : null;
    const endCursor =
      items.length > 0 ? items[items.length - 1].id.toString() : null;

    // Construct the pagination object
    const pagination: BookPagination = {
      edges: items.map((item) => ({
        node: item,
        cursor: item.id.toString(),
      })),
      pageInfo: {
        startCursor,
        endCursor,
        hasNextPage: meta.totalPages > page,
        hasPreviousPage: page > 1,
      },
      total: meta.totalItems,
    };

    await this.cacheManager.set(cacheKey, pagination);

    return pagination;
  }

  @Query(() => Book, { name: 'book' })
  async findOne(@Args('id', { type: () => ID }) id: number): Promise<Book> {
    const cacheKey = `book:${id}`;
    const cachedBook = await this.cacheManager.get(cacheKey);
    if (cachedBook) {
      return cachedBook;
    }
    const book = await this.bookService.findOne(id);
    await this.cacheManager.set(cacheKey, book);
    return book;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor', 'author')
  @Mutation(() => BookResponse, { name: 'createBook' })
  async create(
    @Args('createBookInputDto') createBookInputDto: CreateBookInputDto,
    @CurrentUser() currentUser: UserWithDetailsWithoutPassword,
  ) {
    if (currentUser.role === UserRoles.AUTHOR) {
      // If the current user is an author, ensure they can only add themselves as authors
      createBookInputDto.authors = [currentUser.id];
    }

    if (
      [UserRoles.ADMIN, UserRoles.EDITOR].includes(currentUser.role) &&
      !createBookInputDto.authors.length
    ) {
      // If the current user is an admin or editor, we can put any id or ids by default instead currentUser.id
      createBookInputDto.authors = [currentUser.id];
    }

    try {
      // If the current user is an editor or admin, they can add multiple authors
      return await this.bookService.create(createBookInputDto, currentUser);
    } catch (error) {
      // Handle known errors
      if (
        error instanceof ApolloError ||
        error instanceof ForbiddenException ||
        error instanceof UserInputError
      ) {
        throw error;
      } else {
        throw new ApolloError(
          'An unexpected error occurred',
          'INTERNAL_SERVER_ERROR',
        );
      }
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor', 'author')
  @Mutation(() => Book, { name: 'updateBook' })
  async update(
    @Args('id', ParseIntPipe) id: number,
    @Args('updateBookInputDto') updateBookInputDto: UpdateBookInputDto,
    @CurrentUser() currentUser: UserWithDetailsWithoutPassword,
  ) {
    if (
      currentUser.role === UserRoles.AUTHOR &&
      updateBookInputDto.authors.length > 1
    ) {
      throw new ApolloError(
        'You do not have permission to add multiple authors, only your own',
        'UNAUTHORIZED',
      );
    }
    try {
      // If the current user is an editor or admin, they can add multiple authors
      return await this.bookService.update(id, updateBookInputDto, currentUser);
    } catch (error) {
      if (
        error instanceof ApolloError ||
        error instanceof ForbiddenException ||
        error instanceof UserInputError
      ) {
        throw error;
      } else {
        throw new ApolloError(
          'An unexpected error occurred',
          'INTERNAL_SERVER_ERROR',
        );
      }
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'editor', 'author')
  @UseGuards(JwtAuthGuard)
  @Mutation(() => Book, { name: 'removeBook' })
  async remove(@Args('id', ParseIntPipe) id: number) {
    try {
      return await this.bookService.remove(id);
    } catch (error) {
      // Handle known errors
      if (error instanceof ApolloError || error instanceof UserInputError) {
        throw error;
      } else {
        // Handle unexpected errors
        throw new ApolloError(
          'An unexpected error occurred',
          'INTERNAL_SERVER_ERROR',
        );
      }
    }
  }
}
