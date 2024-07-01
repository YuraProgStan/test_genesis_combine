import { Field, ID, InputType } from '@nestjs/graphql';
import {
    IsArray, IsInt,
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
@InputType({ description: 'Create book object type.' })
export class CreateBookInputDto {
  @Field(() => String, { description: 'A new book title' })
  @IsNotEmpty({ message: 'The book should have a title' })
  @Length(3, 255)
  @Transform(({ value }) => sanitizeHtml(value))
  title: string;

  @Field(() => String, { description: 'A new book description' })
  @IsNotEmpty({ message: 'The book should have a description' })
  @MinLength(10)
  @Transform(({ value }) => sanitizeHtml(value))
  description: string;

  @Field(() => String, { description: 'A new book content' })
  @IsNotEmpty({ message: 'The book should have content' })
  @MinLength(500)
  @Transform(({ value }) => sanitizeHtml(value))
  content: string;

  @Field(() => Number, {
    description: 'A new book publication year',
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1000, { message: 'publicationYear must be at least 1000' })
  @Max(9999, { message: 'publicationYear must be at most 9999' })
  publicationYear?: number;

  @Field(() => [ID])
  @IsArray()
  @Transform(({ value }) => value.map(id => parseInt(id, 10)))
  genres: number[];

  @Field(() => [ID])
  @IsArray()
  @Transform(({ value }) => value.map(id => parseInt(id, 10)))
  authors?: number[];
}
