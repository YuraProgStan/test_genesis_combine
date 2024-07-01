import { Field, ID, InputType, PartialType } from '@nestjs/graphql';
import { CreateGenreInput } from './create-genre.input.dto';
import { IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

@InputType()
export class UpdateGenreInput extends PartialType(CreateGenreInput) {
  @Field(() => ID, {
    description: 'The ID of the genre to be updated',
  })
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  id: number;
}
