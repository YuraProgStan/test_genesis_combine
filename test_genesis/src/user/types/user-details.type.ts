import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserDetailsResponse {
  @Field(() => ID)
  id?: number;

  @Field()
  username?: string;

  @Field()
  email?: string;

  @Field({ nullable: true })
  fullname?: string;

  @Field(() => Int, { nullable: true })
  age?: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
