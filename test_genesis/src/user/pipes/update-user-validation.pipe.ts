import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { UpdateUserInput } from '../dto/update-user.input';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UserInputError } from 'apollo-server-express';
import { UserService } from '../user.service';
import { UserRoles } from '../enums/user-role.enum';
import { isCurrentUserType } from '../../utils/isCurrentUserType';
import { CurrentUserType } from '../types/user.type'; // Adjust the import according to your project structure

@Injectable()
export class UpdateUserValidationPipe implements PipeTransform {
  private currentUser = {};

  constructor(private readonly userService: UserService) {}

  async transform(value: any): Promise<CurrentUserType | UpdateUserInput> {
    if (isCurrentUserType(value)) {
      this.setCurrentUser(value);
      return value;
    }
    const updateUserInput = value;

    // Validate and transform input DTO
    const validatedDto: UpdateUserInput = await this.validateAndTransformDto(updateUserInput);
    this.checkEmptyUpdateInput(validatedDto);
    this.checkPasswordUpdate(validatedDto);
    await this.checkExistingUser(validatedDto);
    const currentUser = this.getCurrentUser() as CurrentUserType;

    // Check permissions
    await this.checkPermissions(validatedDto, currentUser);
    this.setCurrentUser({});

    return validatedDto;
  }

  private checkEmptyUpdateInput(updateUserInput: any) {
    if (!Object.keys(updateUserInput).length) {
      throw new UserInputError('No values provided for user update');
    }
  }

  private checkPasswordUpdate(updateUserInput: any) {
    if ('password' in updateUserInput) {
      throw new UserInputError(
        'Updating password is not allowed through this endpoint',
      );
    }
  }

  private async checkPermissions(
    updateUserInput: UpdateUserInput,
    currentUser: any,
  ) {
    const { id, role } = updateUserInput;
    const currentUserRole = currentUser.role as UserRoles;

    if (id === currentUser.id) {
      this.checkOwnRoleUpdate(currentUserRole, role);
    } else {
      const previousRole = await this.userService.getUserRoleById(id);
      this.checkOtherRoleUpdate(currentUserRole, role, previousRole);
    }
  }

  private checkOwnRoleUpdate(currentUserRole: UserRoles, newRole: UserRoles) {
    if (
      (currentUserRole === UserRoles.EDITOR && newRole === UserRoles.ADMIN) ||
      (currentUserRole === UserRoles.AUTHOR &&
        [UserRoles.ADMIN, UserRoles.EDITOR].includes(newRole)) ||
      (currentUserRole === UserRoles.USER &&
        [UserRoles.ADMIN, UserRoles.EDITOR, UserRoles.AUTHOR].includes(newRole))
    ) {
      throw new BadRequestException(
        'You do not have permission to update this user or this operation',
      );
    }
  }

  private checkOtherRoleUpdate(
    currentUserRole: UserRoles,
    newRole: UserRoles,
    previousRole: UserRoles,
  ) {
    if (
      // Editor only can change role for user and author for this roles
      (currentUserRole === UserRoles.EDITOR &&
        ([UserRoles.ADMIN, UserRoles.EDITOR].includes(newRole) ||
          [UserRoles.ADMIN, UserRoles.EDITOR].includes(previousRole))) ||
      [UserRoles.USER, UserRoles.AUTHOR].includes(currentUserRole)
    ) {
      throw new BadRequestException(
        'You do not have permission to update this user or this operation',
      );
    }
  }

  private async validateAndTransformDto(
    updateUserInput: any,
  ): Promise<UpdateUserInput> {
    const validatedDto = plainToInstance(UpdateUserInput, updateUserInput);
    await this.validateDto(validatedDto);
    return validatedDto;
  }

  private async validateDto(dto: UpdateUserInput): Promise<void> {
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new UserInputError('Validation failed', { errors });
    }
  }

  private async checkExistingUser(dto: UpdateUserInput): Promise<void> {
    const { id } = dto;
    await this.userService.getUserById(id);
  }

  private setCurrentUser(user) {
    this.currentUser = user;
  }

  private getCurrentUser() {
    return this.currentUser;
  }
}
