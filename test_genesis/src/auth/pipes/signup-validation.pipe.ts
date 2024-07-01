import { ConflictException, Injectable, PipeTransform } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UserInputError } from 'apollo-server-express';
import { CreateUserInput } from '../../user/dto/create-user.input';

@Injectable()
export class SignupValidationPipe implements PipeTransform {
  transform(value: any) {
    const createUserInput = value;
    this.validateDto(createUserInput);
    const { password, confirm } = createUserInput;

    if (password !== confirm) {
      throw new ConflictException('Passwords do not match');
    }
    return createUserInput;
  }

  private validateDto(dto: CreateUserInput): void {
    try {
      const errors = validateSync(dto);
      if (errors.length > 0) {
        throw new UserInputError('Validation failed', { errors });
      }
    } catch (error) {
      console.error('SignupValidationPipe - validation error:', error);
      throw error; // Rethrow the error to handle it globally
    }
  }
}
