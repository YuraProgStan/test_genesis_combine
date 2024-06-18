import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Book } from './entities/book.entity';
import { Repository } from 'typeorm';
import { UserInputError } from 'apollo-server-express';
import { Genre } from '../genre/entities/genre.entity';
import { CreateBookInputDto } from './dto/create-book.input.dto';
import { UpdateBookInputDto } from './dto/update-book.input.dto';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { User } from '../user/enitites/user.entity';
import { BookStatus } from './enums/book-status';
import { QUEUE_TYPE, USER_ACTIVITY_TYPE } from '../constants/constants';
import { SqsService } from '../sqs/sqs.service';
import { UserService } from '../user/user.service';
import { GenreService } from '../genre/genre.service';
import { UserRoles } from '../user/enums/user-role.enum';
import { stringsToNumbers } from '../utils/stringsToNumbers';
import { filterNullValues } from '../utils/filterNullVallues';
import { UserWithDetailsWithoutPassword } from '../auth/types/auth.type';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    private readonly sqsService: SqsService,
    @Inject(forwardRef(() => GenreService))
    private genreService: GenreService,
    @Inject(forwardRef(() => UserService))
    private usersService: UserService,
  ) {}

  public async paginate(
    options: IPaginationOptions,
    filters: any = {},
  ): Promise<Pagination<Book>> {
    try {
      const page = Number(options.page);
      const limit = Number(options.limit);

      if (isNaN(page) || isNaN(limit)) {
        throw new Error('Invalid pagination options');
      }
      const qb = this.bookRepository
        .createQueryBuilder('book')
        .leftJoinAndSelect('book.authors', 'author')
        .leftJoinAndSelect('author.details', 'details')
        .leftJoinAndSelect('book.genres', 'genre');

      filters.status = filters.status || BookStatus.PUBLISHED;

      // Apply filters
      if (filters?.title) {
        qb.andWhere('book.title LIKE :title', { title: `%${filters.title}%` });
      }
      if (filters?.publicationYear) {
        qb.andWhere('book.publicationYear = :year', {
          year: filters.publicationYear,
        });
      }
      if (filters?.status) {
        qb.andWhere('book.status = :status', {
          status: filters.status,
        });
      }
      if (filters?.author) {
        qb.andWhere('details.username = :username', {
          username: filters.author,
        });
      }

      if (filters?.sortBy && filters?.sortOrder) {
        qb.orderBy(
          `book.${filters.sortBy}`,
          filters.sortOrder.toUpperCase() as 'ASC' | 'DESC',
        );
      } else {
        qb.orderBy('book.id', 'DESC');
      }
      qb.offset((page - 1) * limit).limit(limit);
      return paginate<Book>(qb, options);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get books from DB',
        error.message,
      );
    }
  }

  public async findOne(id: number) {
    try {
      const book = await this.bookRepository.findOne({
        where: { id },
        relations: ['genres', 'authors', 'authors.details'],
      });
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
    currentUser: UserWithDetailsWithoutPassword,
  ) {
    try {
      const { genres, authors, ...bookData } = createBookInputDto;
      const numGenres = stringsToNumbers(genres);
      const numAuthors = stringsToNumbers(authors);
      const book = this.bookRepository.create(bookData);
      book.authors = authors.map((authorId) => {
        const user = new User();
        user.id = Number(authorId);
        return user;
      });
      if (numGenres.length) {
        const foundGenres: Genre[] =
          await this.genreService.findGenresByIds(numGenres);
        if (foundGenres.length !== numGenres.length) {
          throw new UserInputError('Some genres do not exist');
        }
        book.genres = foundGenres;
      } else {
        throw new UserInputError('No genres provided');
      }

      let foundAuthors: User[] = [];
      if (authors && authors.length > 0) {
        foundAuthors = await this.usersService.findUsersByIds(numAuthors);
        if (foundAuthors.length !== numAuthors.length) {
          throw new UserInputError('Some authors do not exist');
        }
        book.authors = foundAuthors;
      } else {
        const currentUserWithDetails: User =
          await this.usersService.getUserById(currentUser.id);
        book.authors = [currentUserWithDetails];
        foundAuthors = [currentUserWithDetails];
      }

      const createdBook = await this.bookRepository.save(book);

      const messageBody = {
        type: QUEUE_TYPE.USER_ACTIVITY,
        payload: {
          userId: currentUser.id,
          activityType: USER_ACTIVITY_TYPE.BOOK.BOOK_CREATED,
          timestamp: new Date().toString(),
        },
      };
      await this.sqsService.sendMessage(messageBody);

      // Map the authors to return their usernames
      const authorsUsernames = foundAuthors
        .map((author) => {
          return (
            author.details &&
            author.id && {
              username: author.details.username,
              id: author.id,
            }
          );
        })
        .filter(Boolean);
      const response = {
        ...createdBook,
        authors: authorsUsernames,
      };
      return response;
    } catch (error) {
      if (error instanceof UserInputError) {
        throw error;
      } else {
        throw new InternalServerErrorException(
          'Failed to create book in DB',
          error.message,
        );
      }
    }
  }

  public async update(
    id: number,
    updateBookInputDto: UpdateBookInputDto,
    currentUser: UserWithDetailsWithoutPassword,
  ) {
    try {
      const { genres, authors, ...bookData } = updateBookInputDto;

      // Fetch the book and check permissions
      const book = await this.findOne(id);
      this.checkPermissions(currentUser, book);

      // Update genres relation
      if (genres?.length) {
        await this.updateGenres(id, genres);
      }

      // Update authors relation
      if (authors?.length) {
        await this.updateAuthors(id, authors);
      }

      // Update book data
      const filteredBookData = filterNullValues(bookData);
      if (updateBookInputDto.status === BookStatus.PUBLISHED) {
        filteredBookData['publicationYear'] = Number(new Date().getFullYear());
      }
      if (Object.keys(filteredBookData).length) {
        await this.bookRepository.update(id, filteredBookData);
      }

      // Handle publication status
      if (updateBookInputDto.status === BookStatus.PUBLISHED) {
        await this.sendUpdateMessage(currentUser);
      }

      // Fetch and return updated book
      const updatedBook = await this.findOne(id);
      return updatedBook;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update book in DB',
        error.message,
      );
    }
  }

  private async updateGenres(bookId: number, genreIds: number[]) {
    await this.bookRepository
      .createQueryBuilder()
      .relation(Book, 'genres')
      .of(bookId)
      .addAndRemove(
        genreIds,
        (await this.getExistingGenreIds(bookId)).filter(
          (id) => !genreIds.includes(id),
        ),
      );
  }

  private async updateAuthors(bookId: number, authorIds: number[]) {
    await this.bookRepository
      .createQueryBuilder()
      .relation(Book, 'authors')
      .of(bookId)
      .addAndRemove(
        authorIds,
        (await this.getExistingAuthorIds(bookId)).filter(
          (id) => !authorIds.includes(id),
        ),
      );
  }

  private checkPermissions(
    currentUser: UserWithDetailsWithoutPassword,
    book: Book,
  ) {
    if (
      currentUser.role === UserRoles.AUTHOR &&
      !book.authors.some((author) => author.id === currentUser.id)
    ) {
      throw new ForbiddenException('You can only update your own books');
    }
  }

  private async getExistingGenreIds(bookId: number): Promise<number[]> {
    const book = await this.bookRepository.findOne({
      where: { id: bookId },
      relations: ['genres'],
    });
    return book.genres.map((genre) => genre.id);
  }

  private async getExistingAuthorIds(bookId: number): Promise<number[]> {
    const book = await this.bookRepository.findOne({
      where: { id: bookId },
      relations: ['authors'],
    });
    return book.authors.map((author) => author.id);
  }

  // private async getBook(id: number) {
  //   const book = await this.bookRepository.findOne({
  //     where: { id },
  //     relations: ['genres', 'authors'],
  //   });
  //
  //   if (!book) {
  //     throw new UserInputError(`Book #${id} does not exist`);
  //   }
  //
  //   return book;
  // }

  private async sendUpdateMessage(currentUser: UserWithDetailsWithoutPassword) {
    const messageBody = {
      type: QUEUE_TYPE.USER_ACTIVITY,
      payload: {
        userId: currentUser.id,
        activityType:
          USER_ACTIVITY_TYPE.BOOK.BOOK_UPDATED_WITH_STATUS_PUBLISHED,
        timestamp: new Date().toString(),
      },
    };

    await this.sqsService.sendMessage(messageBody);
  }

  public async remove(id: number): Promise<Book> {
    try {
      const book = await this.findOne(id);

      if (!book) {
        throw new UserInputError(`Book #${id} does not exist`);
      }

      book.status = BookStatus.ARCHIVED;

      const updatedBook = await this.bookRepository.save(book);
      const messageBody = {
        type: QUEUE_TYPE.USER_ACTIVITY,
        payload: {
          userId: id,
          activityType: USER_ACTIVITY_TYPE.BOOK.BOOK_DELETED,
          timestamp: new Date().toString(),
        },
      };
      await this.sqsService.sendMessage(messageBody);

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

  async updateBookStatusByUserIdForOneAuthorWhichSoftDeleted(userId: number) {
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

    await this.bookRepository.query(query, [userId]);
  }
}
