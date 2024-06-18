import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateBookInputDto } from './create-book.input.dto';
import { BookStatus } from '../enums/book-status';

@InputType()
export class UpdateBookInputDto extends PartialType(CreateBookInputDto) {
  @Field(() => BookStatus, {
    description: 'The updated book status',
    nullable: true, // Allow the status field to be optional
  })
  status?: BookStatus;
}
