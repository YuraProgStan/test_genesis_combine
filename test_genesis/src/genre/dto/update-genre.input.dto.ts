import { InputType, PartialType } from '@nestjs/graphql';
import { CreateGenreInput } from './create-genre.input.dto';

@InputType()
export class UpdateGenreInput extends PartialType(CreateGenreInput) {}
