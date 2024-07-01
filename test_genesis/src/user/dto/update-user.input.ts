import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { CreateUserInput } from './create-user.input';
import { IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
  @Field(() => ID, {
    description: 'The ID of the user to be updated',
  })
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  id: number;
}
