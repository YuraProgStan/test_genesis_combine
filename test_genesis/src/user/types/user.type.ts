// eslint-disable-next-line max-classes-per-file
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserRoles } from '../enums/user-role.enum';

@ObjectType()
export class CurrentUserType {
  @Field(() => ID)
  id: number;

  @Field(() => UserRoles)
  role: UserRoles;
}

@ObjectType()
export class PasswordResponse {
  @Field()
  message: string;
}

@ObjectType()
export class DeleteUserResponse {
  @Field()
  message: string;
}
