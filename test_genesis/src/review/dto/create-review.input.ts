import { Field, InputType } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, Length, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';
@InputType({ description: 'Create book object type.' })
export class CreateReviewInput {
  @Field(() => String, { description: 'A new review comment' })
  @IsNotEmpty({ message: 'The review should have a comment' })
  @Length(10, 1000)
  @Transform(({ value }) => sanitizeHtml(value))
  comment: string;

  @Field(() => Number, { description: 'A new review  book id' })
  @IsNotEmpty({ message: 'The review should have a  book id' })
  @IsInt()
  bookId: number;

  @Field(() => Number, { description: 'A new review  rating' })
  @IsNotEmpty({ message: 'The review should have a  rating' })
  @Min(0)
  @Max(5)
  rating: number;
}
