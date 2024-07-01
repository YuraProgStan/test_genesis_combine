import { PipeTransform, Injectable } from '@nestjs/common';
import { UserInputError } from 'apollo-server-express';
import { GenreService } from '../../genre/genre.service';
import { UserService } from '../../user/user.service';
import { CreateBookInputDto } from '../dto/create-book.input.dto';
import { UserRoles } from '../../user/enums/user-role.enum';
import { stringsToNumbers } from '../../utils/stringsToNumbers';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CurrentUserType } from '../../user/types/user.type';
import { isCurrentUserType } from '../../utils/isCurrentUserType';

@Injectable()
export class BookCreateValidationPipe implements PipeTransform {
  private currentUser = {};

  constructor(
    private readonly genreService: GenreService,
    private readonly userService: UserService,
  ) {}

  async transform(value: any): Promise<CurrentUserType | CreateBookInputDto> {
    if (isCurrentUserType(value)) {
      this.setCurrentUser(value);
      return value;
    }
    const createBookInputDto = value;

    const validatedDto = await this.validateAndTransformDto(createBookInputDto);
    const { genres, authors, ...bookData } = validatedDto;
    const currentUser = this.getCurrentUser() as CurrentUserType;
    await this.validateGenres(genres);
    const validatedAuthors = await this.validateAndTransformAuthors(
      authors,
      currentUser,
    );
    validatedDto.authors = validatedAuthors;

    const updatedAuthors = this.applyRoleBasedAuthorLogic(
      validatedDto,
      currentUser,
    );
    this.setCurrentUser({});
    return {
      ...bookData,
      genres,
      authors: updatedAuthors,
    };
  }

  private async validateAndTransformDto(
    createBookInputDto: CreateBookInputDto,
  ): Promise<CreateBookInputDto> {
    const validatedDto = plainToInstance(
      CreateBookInputDto,
      createBookInputDto,
    );
    await this.validateDto(validatedDto);
    return validatedDto;
  }

  private async validateDto(dto: CreateBookInputDto): Promise<void> {
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new UserInputError('Validation failed', { errors });
    }
  }

  private async validateGenres(genres: number[]): Promise<void> {
    const numGenres = stringsToNumbers(genres);
    const foundGenres = await this.genreService.findGenresByIds(numGenres);

    if (foundGenres.length !== numGenres.length) {
      throw new UserInputError('Some genres do not exist');
    }
  }

  private async validateAndTransformAuthors(
    authors: number[],
    currentUser: CurrentUserType,
  ): Promise<number[]> {
    if (!authors || authors.length === 0) {
      return [currentUser.id];
    }

    const numAuthors = stringsToNumbers(authors);
    const foundAuthors = await this.userService.findUsersByIds(numAuthors);

    if (foundAuthors.length !== numAuthors.length) {
      throw new UserInputError('Some authors do not exist');
    }

    return authors;
  }

  private applyRoleBasedAuthorLogic(
    createBookInputDto: CreateBookInputDto,
    currentUser: CurrentUserType,
  ): number[] {
    let authors = createBookInputDto.authors;

    if (currentUser.role === UserRoles.AUTHOR) {
      authors = [currentUser.id];
    }

    if (
      [UserRoles.ADMIN, UserRoles.EDITOR].includes(currentUser.role) &&
      !createBookInputDto.authors.length
    ) {
      authors = [currentUser.id];
    }

    return authors;
  }

  private setCurrentUser(user) {
    this.currentUser = user;
  }

  private getCurrentUser() {
    return this.currentUser;
  }
}
