// eslint-disable-next-line max-classes-per-file
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { UserRoles } from '../../user/enums/user-role.enum';

@ObjectType()
class AuthPayload {
  @Field(() => String)
  access_token: string;
}

export { AuthPayload };

@ObjectType()
export class UserDetailsWithoutPassword {
  @Field()
  username?: string;

  @Field()
  email?: string;
}

@ObjectType()
export class UserWithDetailsWithoutPassword {
  @Field(() => UserDetailsWithoutPassword)
  details: UserDetailsWithoutPassword;

  @Field(() => Int)
  id?: number;

  @Field(() => UserRoles)
  role?: UserRoles;
}

@ObjectType()
export class MessageResponse {
  @Field()
  message: string;
}
