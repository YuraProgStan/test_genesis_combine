import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'BookStats object type.' })
export class BookStats {
  @Field(() => ID)
  bookId: number;

  @Field(() => Number)
  totalVotes: number;

  @Field(() => Number)
  meanRating: number;
}
