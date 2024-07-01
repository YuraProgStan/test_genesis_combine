import { PipeTransform, Injectable, ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UserRoles } from '../../user/enums/user-role.enum';
import { UpdateBookInputDto } from '../dto/update-book.input.dto';
import { BookService } from '../book.service';
import { Book } from '../entities/book.entity';
import { UserInputError } from 'apollo-server-express';
import { isCurrentUserType } from '../../utils/isCurrentUserType';
import { CurrentUserType } from '../../user/types/user.type';

@Injectable()
export class BookUpdateValidationPipe implements PipeTransform {
  private currentUser = {};

  constructor(private readonly bookService: BookService) {}

  /* eslint-disable class-methods-use-this */
  async transform(value: any): Promise<CurrentUserType | UpdateBookInputDto> {
    if (isCurrentUserType(value)) {
      this.setCurrentUser(value);
      return value;
    }
    const updateBookInputDto = value;
    const validatedDto = await this.validateAndTransformDto(updateBookInputDto);
    const currentUser = this.getCurrentUser() as CurrentUserType;
    const book = await this.bookService.findBookById(validatedDto.id);
    this.checkPermissions(currentUser, book);
    this.setCurrentUser({});
    return validatedDto;
  }

  private async validateAndTransformDto(
    updateBookInputDto: UpdateBookInputDto,
  ): Promise<UpdateBookInputDto> {
    const validatedDto = plainToInstance(
      UpdateBookInputDto,
      updateBookInputDto,
    );
    await this.validateDto(validatedDto);
    return validatedDto;
  }

  private async validateDto(dto: UpdateBookInputDto): Promise<void> {
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new UserInputError('Validation failed', { errors });
    }
  }

  private checkPermissions(currentUser: CurrentUserType, book: Book) {
    if (
      currentUser.role === UserRoles.AUTHOR &&
      !book.authors.some((author) => author.id === currentUser.id)
    ) {
      throw new ForbiddenException('You can only update your own books');
    }
    if (currentUser.role === UserRoles.AUTHOR && book.authors.length > 1) {
      throw new ForbiddenException(
        'You do not have permission to add multiple authors, only your own',
      );
    }
  }

  private setCurrentUser(user) {
    this.currentUser = user;
  }

  private getCurrentUser() {
    return this.currentUser;
  }
}
