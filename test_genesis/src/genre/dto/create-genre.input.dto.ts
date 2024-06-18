import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

@InputType({ description: 'Create genre object type.' })
export class CreateGenreInput {
  @Field(() => String, { description: 'Genre name' })
  @IsNotEmpty({ message: 'Genre name should not be empty' })
  @Length(3, 255, {
    message:
      'Genre name must be at least 3 characters long and not greater 255 characters',
  })
  name: string;

  @IsOptional()
  @Field(() => String, { description: 'Genre description', nullable: true })
  @IsString()
  @Length(10, 1000, {
    message:
      'Genre description must be at least 10 characters long and not greater than 1000 characters',
  })
  description?: string;
}
