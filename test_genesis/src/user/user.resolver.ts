import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  Inject,
  NotFoundException,
  ParseIntPipe,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserInput } from './dto/update-user.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApolloError, UserInputError } from 'apollo-server-express';
import { ChangePasswordInput } from './dto/change-user-password.dto';
import { PasswordResponse, UserResponse } from './types/user.type';
import { UserDetails } from './enitites/user-details.entity';
import { UserExistsInterceptor } from './interceptors/user-exist.interceptor';
import { UserWithDetailsWithoutPassword } from '../auth/types/auth.type';
import { CurrentUser } from './decorators/users.decorator';
import { User } from './enitites/user.entity';
import { UserRoles } from './enums/user-role.enum';
import { UserCacheService } from '../cache/user/user-cache.service';

@Resolver()
export class UserResolver {
  constructor(
    private userService: UserService,
    @Inject('USER_CACHE_MANAGER')
    private cacheManager: UserCacheService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Query(() => [UserResponse], { name: 'users' })
  async getAllUsers() {
    try {
      return await this.userService.findAll();
    } catch (error) {
      throw new ApolloError('Failed to get users', 'INTERNAL_SERVER_ERROR');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => UserResponse, { name: 'user', nullable: true })
  async getUserById(
    @Args('id', { type: () => ID }, ParseIntPipe) id: number,
    @CurrentUser() currentUser: User,
  ): Promise<Partial<any>> {
    if (currentUser.role !== UserRoles.ADMIN && currentUser.id !== id) {
      throw new ApolloError(
        'You are not authorized to view this user',
        'UNAUTHORIZED',
      );
    }
    const cacheKey = `user:${id}`;
    const cachedUser = await this.cacheManager.get(cacheKey);
    if (cachedUser) {
      return cachedUser;
    }
    const user: UserResponse = await this.userService.getUserById(id);
    await this.cacheManager.set(cacheKey, user);
    return user;
  }
  catch(error) {
    if (error instanceof UserInputError) {
      throw error;
    }
    throw new ApolloError('Failed to get user', 'INTERNAL_SERVER_ERROR');
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => UserResponse, { name: 'updateUser' })
  async updateUser(
    @Args('id', ParseIntPipe) id: number,
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
    @CurrentUser() user: Partial<User> & Partial<UserDetails>,
  ): Promise<UserWithDetailsWithoutPassword> {
    try {
      if (
        (user.role !== UserRoles.ADMIN &&
          (id !== user.id || updateUserInput.role === UserRoles.ADMIN)) ||
        ((user.role === UserRoles.USER || user.role === UserRoles.AUTHOR) &&
          updateUserInput.role === UserRoles.EDITOR) ||
        (user.role === UserRoles.USER &&
          updateUserInput.role === UserRoles.AUTHOR)
      ) {
        throw new UserInputError(
          'You do not have permission to update this user or this operation',
        );
      }
      return await this.userService.update(id, updateUserInput, user);
    } catch (error) {
      if (error instanceof UserInputError) {
        throw error;
      }
      throw new ApolloError('Failed to update user', 'INTERNAL_SERVER_ERROR');
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Mutation(() => PasswordResponse, { name: 'removeUser' })
  async deleteUserById(
    @Args('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
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
  @Mutation(() => PasswordResponse)
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
}
