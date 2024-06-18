import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserRoles } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';
import { UserDetailsResponse } from './user-details.type';
import { BookResponse } from '../../book/types/book.type';

@ObjectType()
export class UserResponse {
  @Field(() => ID)
  id?: number;

  @Field(() => UserRoles)
  role?: UserRoles;

  @Field(() => UserStatus)
  status?: UserStatus;

  @Field(() => UserDetailsResponse)
  details?: UserDetailsResponse;

  @Field(() => [BookResponse])
  books?: BookResponse[];

  @Field(() => Date)
  createdAt?: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date | null;
}

@ObjectType()
export class PasswordResponse {
  @Field()
  message: string;
}
