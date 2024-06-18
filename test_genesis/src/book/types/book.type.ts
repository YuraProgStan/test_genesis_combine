import {
  ObjectType,
  Field,
  Int,
  ArgsType,
  InputType,
  ID,
} from '@nestjs/graphql';
import { Book } from '../entities/book.entity';
import { SearchBooksInputDto } from '../dto/search-book.input.dto';
import { GenreResponse } from '../../genre/types/types';
@ObjectType()
class BookEdge {
  @Field(() => Book)
  node: Book;

  @Field(() => String)
  cursor: string;
}

@ObjectType()
class PageInfo {
  @Field(() => String, { nullable: true })
  startCursor?: string;

  @Field(() => String, { nullable: true })
  endCursor?: string;

  @Field(() => Boolean)
  hasNextPage: boolean;

  @Field(() => Boolean)
  hasPreviousPage: boolean;
}

@ObjectType()
export class BookPagination {
  @Field(() => [BookEdge])
  edges: BookEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int)
  total: number;
}

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, { defaultValue: 1 })
  page: number;

  @Field(() => Int, { defaultValue: 10 })
  limit: number;

  @Field(() => SearchBooksInputDto, { nullable: true })
  filters?: SearchBooksInputDto;
}

@InputType()
export class BookFilters {
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  publicationYear?: number;

  @Field({ nullable: true })
  author?: string;

  @Field({ nullable: true })
  sortBy?: string;

  @Field({ nullable: true })
  sortOrder?: 'ASC' | 'DESC';
}

@ObjectType()
export class BookAuthorCreateResponse {
  @Field(() => ID)
  id?: number;

  @Field(() => String)
  username?: string;
}
@ObjectType()
export class BookResponse {
  @Field(() => ID)
  id?: number;

  @Field(() => String)
  title?: string;

  @Field(() => String)
  description?: string;

  @Field(() => String)
  content?: string;

  @Field(() => [BookAuthorCreateResponse], { nullable: true })
  authors?: BookAuthorCreateResponse[];

  @Field(() => [GenreResponse])
  genres?: GenreResponse[];

  @Field(() => Int, { nullable: true })
  publicationYear?: number | null;

  @Field(() => String)
  status?: string;

  @Field(() => Date)
  createdAt?: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date;
}
