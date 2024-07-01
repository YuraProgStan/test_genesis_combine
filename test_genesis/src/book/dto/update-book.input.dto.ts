import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { CreateBookInputDto } from './create-book.input.dto';
import { BookStatus } from '../enums/book-status';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Length,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';

@InputType()
export class UpdateBookInputDto extends PartialType(CreateBookInputDto) {
  @Field(() => ID, {
    description: 'The ID of the book to be updated',
  })
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  id: number;

  @Field(() => BookStatus, {
    description: 'The updated book status',
    nullable: true, // Allow the status field to be optional
  })
  @IsOptional()
  status?: BookStatus;

  //
  // @IsOptional()
  // @Field(() => String, { description: 'A updated book title', nullable: true })
  // @Length(3, 255)
  // @Transform(({ value }) => sanitizeHtml(value))
  // title?: string;
  //
  // @IsOptional()
  // @Field(() => String, { description: 'A updated book description', nullable: true  })
  // @MinLength(10)
  // @Transform(({ value }) => sanitizeHtml(value))
  // description?: string;
  //
  // @Field(() => String, { description: 'A updated book content', nullable: true  })
  // @IsOptional()
  // @IsNotEmpty({ message: 'The book should have content' })
  // @MinLength(500)
  // @Transform(({ value }) => sanitizeHtml(value))
  // content?: string;
  //
  // @Field(() => Number, {
  //   description: 'A new book publication year',
  //   nullable: true,
  // })
  // @IsOptional()
  // @IsInt()
  // @Min(1000, { message: 'publicationYear must be at least 1000' })
  // @Max(9999, { message: 'publicationYear must be at most 9999' })
  // publicationYear?: number;
  //
  // @Field(() => [ID])
  // @IsOptional()
  // @IsArray()
  //   @Transform(({ value }) => value.map((val: string) => parseInt(val, 10)), { toClassOnly: true })
  // genres?: number[];
  //
  // @Field(() => [ID])
  // @IsOptional()
  // @IsArray()
  // @Transform(({ value }) => value.map((val: string) => parseInt(val, 10)), { toClassOnly: true })
  // authors?: number[];
}
