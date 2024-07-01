import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { UserService } from '../user.service';
import { CurrentUserType } from '../types/user.type';
import { isCurrentUserType } from '../../utils/isCurrentUserType';
import { UserRoles } from '../enums/user-role.enum';
import { ApolloError } from 'apollo-server-express';

@Injectable()
export class GetUserValidationPipe implements PipeTransform {
  private currentUser = {};

  constructor(private readonly userService: UserService) {}

  async transform(value: any): Promise<CurrentUserType | number> {
    if (isCurrentUserType(value)) {
      this.setCurrentUser(value);
      return value;
    }
    if (typeof value === 'number') {
      const validId = value;
      const currentUser = this.getCurrentUser() as CurrentUserType;
      this.checkPermissions(currentUser, validId);
      this.setCurrentUser({});
      return validId;
    }

    throw new BadRequestException(
      'Invalid input: Only an object with an id field is allowed',
    );
  }

  private checkPermissions(currentUser: CurrentUserType, id: number) {
    if (currentUser.role !== UserRoles.ADMIN && currentUser.id !== id) {
      throw new ApolloError(
        'You are not authorized to view this user',
        'UNAUTHORIZED',
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
