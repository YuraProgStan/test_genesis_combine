import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SearchBooksInputDto } from './search-book.input.dto';


@InputType()
export class QueryPagingBookDto {
  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  page: number = 1;

  @Field(() => Int, { defaultValue: 10 })
  @IsInt()
  limit: number = 10;

  @Field({ nullable: true })
  @Type(() => SearchBooksInputDto)
  @IsOptional()
  @ValidateNested()
  filters?: SearchBooksInputDto;
}
