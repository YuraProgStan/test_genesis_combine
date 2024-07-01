import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  Inject,
  NotFoundException,
  ParseIntPipe,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserInput } from './dto/update-user.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApolloError, UserInputError } from 'apollo-server-express';
import { ChangePasswordInput } from './dto/change-user-password.dto';
import { UserExistsInterceptor } from './interceptors/user-exist.interceptor';
import { UserWithDetailsWithoutPassword } from '../auth/types/auth.type';
import { CurrentUser } from './decorators/users.decorator';
import { UserCacheService } from '../cache/user/user-cache.service';
import { UpdateUserValidationPipe } from './pipes/update-user-validation.pipe';
import { User } from './entities/user.entity';
import { UserDetails } from './entities/user-details.entity';
import { GetUserValidationPipe } from './pipes/get-user-validation.pipe';
import {CurrentUserType, DeleteUserResponse} from './types/user.type';

@Resolver()
export class UserResolver {
  constructor(
    private userService: UserService,
    @Inject('USER_CACHE_MANAGER')
    private cacheManager: UserCacheService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Query(() => [User], { name: 'users' })
  async getAllUsers(): Promise<User[]> {
    try {
      return await this.userService.findAll();
    } catch (error) {
      throw new ApolloError('Failed to get users', 'INTERNAL_SERVER_ERROR');
    }
  }

  @UseGuards(JwtAuthGuard)
  @UsePipes(GetUserValidationPipe)
  @Query(() => User, { name: 'user', nullable: true })
  async getUserById(
    @Args('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: CurrentUserType,
  ): Promise<User> {
    const cacheKey = `user:${id}`;
    const cachedUser = await this.cacheManager.get(cacheKey);
    if (cachedUser) {
      const cachedUserWithDateFormat: User = this.convertDateFields(cachedUser);
      return cachedUserWithDateFormat;
    }
    const user: User = await this.userService.getUserById(id);
    await this.cacheManager.set(cacheKey, user);
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => User, { name: 'updateUser' })
  @UsePipes(UpdateUserValidationPipe)
  async updateUser(
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
    @CurrentUser() currentUser: CurrentUserType,
  ): Promise<UserWithDetailsWithoutPassword> {
    const { id, ...updateUserInputData } = updateUserInput;
    try {
      return await this.userService.update(id, updateUserInputData);
    } catch (error) {
      throw new ApolloError('Failed to update user', 'INTERNAL_SERVER_ERROR');
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Mutation(() => DeleteUserResponse, { name: 'removeUser' })
  async deleteUserById(
    @Args('id', ParseIntPipe) id: number,
  ): Promise<DeleteUserResponse> {
    try {
      return await this.userService.remove(id);
    } catch (error) {
      if (error instanceof UserInputError) {
        throw error;
      }
      throw new ApolloError('Failed to remove user', 'INTERNAL_SERVER_ERROR');
    }
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(UserExistsInterceptor)
  @Mutation(() => UserDetails)
  async changePassword(
    @Args('input') input: ChangePasswordInput,
  ): Promise<{ message: string }> {
    try {
      return this.userService.changePassword(input);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new ApolloError(
        'Failed to change user password',
        'INTERNAL_SERVER_ERROR',
      );
    }
  }

  private convertDateFields(user: User): User {
    const newUser: User = { ...user };
    newUser.createdAt = new Date(user.createdAt);
    newUser.updatedAt = new Date(user.updatedAt);
    newUser.details.createdAt = new Date(user.details.createdAt);
    newUser.details.updatedAt = new Date(user.details.updatedAt);

    return newUser;
  }
}
