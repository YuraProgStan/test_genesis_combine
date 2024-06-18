import { Field, InputType, Int } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { MESSAGES, REGEX } from '../../../app.utils';
import { UserRoles } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';

@InputType({ description: 'Create user object type.' })
export class CreateUserInput {
  @Field(() => String, { description: 'A new user name' })
  @IsNotEmpty({ message: 'The user should have a username' })
  @Length(3, 255)
  username: string;

  @Field(() => String, { description: 'A new user email' })
  @IsNotEmpty({ message: 'The user should have a email' })
  @IsEmail()
  email: string;

  @Field(() => String, { description: 'A new user password' })
  @IsNotEmpty()
  @Length(8, 24)
  @Matches(REGEX.PASSWORD_RULE, { message: MESSAGES.PASSWORD_RULE_MESSAGE })
  password: string;

  @Field(() => String, { description: 'Confirm password' })
  @IsNotEmpty()
  @Length(8, 24)
  @Matches(REGEX.PASSWORD_RULE, { message: MESSAGES.PASSWORD_RULE_MESSAGE })
  confirm: string;

  @Field(() => UserRoles, { description: 'Role of the user', nullable: true })
  @IsOptional()
  role?: UserRoles;

  @Field(() => UserStatus, {
    description: 'Status of the user',
    nullable: true,
  })
  @IsOptional()
  status?: UserStatus;

  @Field(() => String, { description: 'Full name of the user', nullable: true })
  @IsOptional()
  @Length(3, 255)
  fullname?: string;

  @Field(() => Int, { description: 'Age of the user', nullable: true })
  @IsOptional()
  @Min(0, { message: 'Age must be a positive number' })
  @Max(120, { message: 'Age must be less than 120' })
  age?: number;
}
