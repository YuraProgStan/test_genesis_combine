import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateReviewInput } from './create-review.input';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType()
export class UpdateReviewInput extends PartialType(CreateReviewInput) {
  @Field(() => String, { description: 'review id for updated body' })
  @IsNotEmpty({ message: 'The updated review should have a review id' })
  @IsUUID('4', { message: 'The reviewId must be a valid UUID' })
  reviewId: string;
}
