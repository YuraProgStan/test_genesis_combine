import { Field, InputType } from '@nestjs/graphql';
import {IsEnum, IsInt, IsOptional, IsString, Length, Max, Min} from 'class-validator';
import { Transform } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';
import { CustomBookSortBy } from '../enums/book-status';

@InputType()
export class SearchBooksInputDto {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Length(3, 255, {
    message:
      'Author user name  must be at least 3 characters long and not greater 255 characters',
  })
  @Transform(({ value }) => sanitizeHtml(value))
  author?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Length(3, 255, {
    message:
      'Genre  must be at least 3 characters long and not greater 255 characters',
  })
  @Transform(({ value }) => sanitizeHtml(value))
  genre?: string;

  @Field(() => Number, {
    description: 'Search book publication year',
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1000, { message: 'publicationYear must be at least 1000' })
  @Max(9999, { message: 'publicationYear must be at most 9999' })
  publicationYear?: number;

  @Field(() => CustomBookSortBy, {
    nullable: true,
  })
  @IsOptional()
  @IsEnum(CustomBookSortBy)
  sortBy?: CustomBookSortBy;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}
