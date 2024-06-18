import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, Length, Matches } from 'class-validator';
import { MESSAGES, REGEX } from '../../../app.utils';

@InputType()
export class ChangePasswordInput {
  @Field(() => ID)
  @IsNotEmpty()
  id: number;

  @Field(() => String, { description: 'Old password for user' })
  @IsNotEmpty()
  @Length(8, 24)
  @Matches(REGEX.PASSWORD_RULE, { message: MESSAGES.PASSWORD_RULE_MESSAGE })
  oldPassword: string;

  @Field(() => String, { description: 'Old password for user' })
  @IsNotEmpty()
  @Length(8, 24)
  @Matches(REGEX.PASSWORD_RULE, { message: MESSAGES.PASSWORD_RULE_MESSAGE })
  newPassword: string;
}
