import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, IsInt } from 'class-validator';
import { UserResponse } from '../../user/types/user.type';
import { GenreResponse } from '../../genre/types/types';

@InputType()
export class SearchBooksInputDto {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field(() => UserResponse, { nullable: true })
  @IsOptional()
  @IsString()
  authors?: UserResponse[];

  @Field(() => GenreResponse, { nullable: true })
  @IsOptional()
  @IsString()
  genres?: GenreResponse[];

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsInt()
  publicationYear?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}
