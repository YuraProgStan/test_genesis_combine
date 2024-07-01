import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Book } from './entities/book.entity';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { BookStatus } from './enums/book-status';
import { InjectRepository } from '@nestjs/typeorm';
@Injectable()
export class BookRepository extends Repository<Book> {
  constructor(@InjectRepository(Book) private dataSource: DataSource) {
    super(Book, dataSource.manager);
  }

  public async findOneWithRelations(id: number): Promise<Book | undefined> {
    return this.findOne({
      where: { id },
      relations: ['genres', 'authors', 'authors.details'],
    });
  }

  public async findOneWithRelationsAuthors(
    id: number,
  ): Promise<Book | undefined> {
    return this.findOne({
      where: { id },
      relations: ['authors'],
    });
  }

  public async findOneWithRelationsGenres(
    id: number,
  ): Promise<Book | undefined> {
    return this.findOne({
      where: { id },
      relations: ['genres'],
    });
  }

  public async createAndSaveBook(bookUpdated: Partial<Book>): Promise<Book> {
    const book = this.create(bookUpdated);
    return this.save(book);
  }

  public async updateBookById(id, book) {
    await this.update(id, book);
  }

  public async updateAuthorsByBookId(bookId, authorIds, existingAuthorIds) {
    await this.createQueryBuilder()
      .relation(Book, 'authors')
      .of(bookId)
      .addAndRemove(
        authorIds,
        existingAuthorIds.filter((id) => !authorIds.includes(id)),
      );
  }

  public async updateGenresByBookId(bookId, genresIds, existingGenreIds) {
    await this.createQueryBuilder()
      .relation(Book, 'genres')
      .of(bookId)
      .addAndRemove(
        genresIds,
        existingGenreIds.filter((id) => !genresIds.includes(id)),
      );
  }

  public async updateBookStatusByUserIdForOneAuthorWhichSoftDeleted(
    userId: number,
  ) {
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

    await this.query(query, [userId]);
  }

  public async paginateBooks(
    options: IPaginationOptions,
    filters: any = {},
  ): Promise<Pagination<Book>> {
    const page = Number(options.page);
    const limit = Number(options.limit);

    const qb = this.createQueryBuilder('book')
      .leftJoinAndSelect('book.authors', 'author')
      .leftJoinAndSelect('author.details', 'details')
      .leftJoinAndSelect('book.genres', 'genre');

    // eslint-disable-next-line no-param-reassign
    filters.status = filters.status || BookStatus.PUBLISHED;

    this.applyFilters(qb, filters);
    this.applyPaginationOptions(qb, page, limit);

    return paginate<Book>(qb, options);
  }

  private applyFilters(qb: SelectQueryBuilder<Book>, filters: any) {
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

    const sortOrder = filters.sortOrder?.toUpperCase() || 'DESC';
    const sortBy = filters.sortBy || 'BOOK_ID';

    switch (sortBy) {
      case 'GENRE':
        qb.orderBy('genre.name', sortOrder as 'ASC' | 'DESC');
        break;
      case 'AUTHOR':
        qb.orderBy('author.details.username', sortOrder as 'ASC' | 'DESC');
        break;
      case 'TITLE':
        qb.orderBy('book.title', sortOrder as 'ASC' | 'DESC');
        break;
      case 'PUBLICATION_YEAR':
        qb.orderBy('book.publicationYear', sortOrder as 'ASC' | 'DESC');
        break;
      case 'BOOK_ID':
        qb.orderBy('book.id', sortOrder as 'ASC' | 'DESC');
        break;
      default:
        qb.orderBy('book.id', sortOrder as 'ASC' | 'DESC');
        break;
    }
  }

  private applyPaginationOptions(
    qb: SelectQueryBuilder<Book>,
    page: number,
    limit: number,
  ) {
    qb.offset((page - 1) * limit).limit(limit);
  }
}
