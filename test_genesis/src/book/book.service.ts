import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Book } from './entities/book.entity';
import { UserInputError } from 'apollo-server-express';
import { CreateBookInputDto } from './dto/create-book.input.dto';
import { UpdateBookInputDto } from './dto/update-book.input.dto';
import { IPaginationMeta, IPaginationOptions } from 'nestjs-typeorm-paginate';
import { BookStatus } from './enums/book-status';
import { QUEUE_TYPE } from '../constants/constants';
import { SqsService } from '../sqs/sqs.service';
import { UserService } from '../user/user.service';
import { GenreService } from '../genre/genre.service';
import { stringsToNumbers } from '../utils/stringsToNumbers';
import { filterNullValues } from '../utils/filterNullVallues';
import { BookPagination, MessageType } from './types/book.type';
import { BookRepository } from './book.repository';
import { CurrentUserType } from '../user/types/user.type';
import { ActivityType } from '../user-activities/enums/enums';

@Injectable()
export class BookService {
  constructor(
    private readonly bookRepository: BookRepository,
    private readonly sqsService: SqsService,
    @Inject(forwardRef(() => GenreService))
    private genreService: GenreService,
    @Inject(forwardRef(() => UserService))
    private usersService: UserService,
  ) {}

  public async paginate(
    options: IPaginationOptions,
    filters: any = {},
  ): Promise<BookPagination> {
    try {
      const { page, limit } = options;
      if (Number.isNaN(page) || Number.isNaN(limit)) {
        throw new Error('Invalid pagination options');
      }

      const { items, meta } = await this.bookRepository.paginateBooks(
        options,
        filters,
      );
      return this.buildPaginationResponse(items, meta, Number(page));
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get books from DB',
        error.stack, // Include the original error message for debugging
      );
    }
  }

  private buildPaginationResponse(
    items: Book[],
    meta: IPaginationMeta,
    page: number,
  ): BookPagination {
    const startCursor = items.length > 0 ? items[0].id.toString() : null;
    const endCursor =
      items.length > 0 ? items[items.length - 1].id.toString() : null;

    return {
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
  }

  public async findBookById(id: number) {
    try {
      const book = await this.bookRepository.findOneWithRelations(id);
      if (!book) {
        throw new UserInputError(`Book #${id} does not exist`);
      }

      return book;
    } catch (error) {
      if (error instanceof UserInputError) {
        throw error;
      } else {
        throw new InternalServerErrorException(
          'Failed to find book from DB',
          error.message,
        );
      }
    }
  }

  public async create(
    createBookInputDto: CreateBookInputDto,
    currentUser: CurrentUserType,
  ) {
    try {
      const { genres, authors, ...bookData } = createBookInputDto;
      const numGenres = stringsToNumbers(genres);
      const numAuthors = stringsToNumbers(authors);
      const [foundGenres, foundAuthors] = await Promise.all([
        this.genreService.findGenresByIds(numGenres),
        this.usersService.findUsersByIds(numAuthors),
      ]);
      const bookUpdated: Partial<Book> = { ...bookData };
      bookUpdated.genres = foundGenres;
      bookUpdated.authors = foundAuthors;

      const createdBook: Book =
        await this.bookRepository.createAndSaveBook(bookUpdated);

      const userId: number = currentUser.id;
      await this.sendCreateMessage(userId);
      return createdBook;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create book in DB',
        error.message,
      );
    }
  }

  public async update(
    updateBookInputDto: UpdateBookInputDto,
    currentUser: CurrentUserType,
  ): Promise<Book> {
    try {
      const { id, genres, authors, ...bookData } = updateBookInputDto;

      // Update genres relation
      if (genres?.length) {
        await this.updateGenresByBookId(id, genres);
      }

      // Update authors relation
      if (authors?.length) {
        await this.updateAuthorsByBookId(id, authors);
      }

      // Update book data
      const filteredBookData: Partial<Book> = filterNullValues(bookData);
      if (updateBookInputDto.status === BookStatus.PUBLISHED) {
        filteredBookData.publicationYear = Number(new Date().getFullYear());
      }
      if (Object.keys(filteredBookData).length) {
        await this.bookRepository.updateBookById(id, filteredBookData);
      }

      // Handle publication status
      if (updateBookInputDto.status === BookStatus.PUBLISHED) {
        const userId: number = currentUser.id;
        await this.sendUpdateMessage(userId);
      }

      const updatedBook = await this.findBookById(id);
      return updatedBook;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update book in DB',
        error.message,
      );
    }
  }

  public async remove(id: number): Promise<Book> {
    try {
      const book = await this.findBookById(id);
      if (!book) {
        throw new UserInputError(`Book #${id} does not exist`);
      }
      book.status = BookStatus.ARCHIVED;
      const updatedBook = await this.bookRepository.createAndSaveBook(book);
      await this.sendRemoveMessage(id);
      return updatedBook;
    } catch (error) {
      if (error instanceof UserInputError) {
        throw error;
      } else {
        throw new InternalServerErrorException(
          'Failed to remove book from DB',
          error.message,
        );
      }
    }
  }

  public async updateBookStatusByUserIdForOneAuthorWhichSoftDeleted(
    userId: number,
  ): Promise<void> {
    try {
      await this.bookRepository.updateBookStatusByUserIdForOneAuthorWhichSoftDeleted(
        userId,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update book status',
        error.message,
      );
    }
  }

  private async updateGenresByBookId(bookId: number, genreIds: number[]) {
    const existingGenreIds: number[] = await this.getExistingGenreIds(bookId);
    await this.bookRepository.updateGenresByBookId(
      bookId,
      genreIds,
      existingGenreIds,
    );
  }

  private async updateAuthorsByBookId(bookId: number, authorIds: number[]) {
    const existingAuthorIds: number[] = await this.getExistingAuthorIds(bookId);
    await this.bookRepository.updateAuthorsByBookId(
      bookId,
      authorIds,
      existingAuthorIds,
    );
  }

  private async getExistingGenreIds(bookId: number): Promise<number[]> {
    const book = await this.bookRepository.findOneWithRelationsGenres(bookId);
    return book.genres.map((genre) => genre.id);
  }

  private async getExistingAuthorIds(bookId: number): Promise<number[]> {
    const book = await this.bookRepository.findOneWithRelationsAuthors(bookId);
    return book.authors.map((author) => author.id);
  }

  private generateMessage(userId, activityType): MessageType {
    return {
      type: QUEUE_TYPE.USER_ACTIVITY,
      payload: {
        userId,
        activityType,
        timestamp: new Date().toString(),
      },
    };
  }

  private async sendCreateMessage(userId: number) {
    const message = this.generateMessage(userId, ActivityType.BOOK_CREATED);

    await this.sqsService.sendMessage(message);
  }

  private async sendUpdateMessage(userId) {
    const message = this.generateMessage(
      userId,
      ActivityType.BOOK_UPDATED_WITH_STATUS_PUBLISHED,
    );

    await this.sqsService.sendMessage(message);
  }

  private async sendRemoveMessage(userId) {
    const message = this.generateMessage(userId, ActivityType.BOOK_DELETED);

    await this.sqsService.sendMessage(message);
  }
}
