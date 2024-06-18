import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType() // Decorate the class with @ObjectType() to define it as a GraphQL object type
export class GenreResponse {
  @Field(() => ID, { nullable: true })
  id?: number;
  @Field()
  name?: string;
  @Field({ nullable: true })
  description?: string;
  @Field(() => Date,{ nullable: true })
  createdAt?: Date;
  @Field(() => Date,{ nullable: true })
  updatedAt?: Date;
}
