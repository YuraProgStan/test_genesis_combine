import { AuthService } from './auth.service';
import { Args, Context, Info, Mutation, Resolver } from '@nestjs/graphql';
import { UserService } from '../user/user.service';
import { LocalAuthGuard } from './local-auth.guard';
import {
  BadRequestException,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  AuthPayload,
  MessageResponse,
  UserWithDetailsWithoutPassword,
} from './types/auth.type';
import { CurrentUser } from '../user/decorators/users.decorator';
import { ApolloError } from 'apollo-server-express';
import { CreateUserInput } from '../user/dto/create-user.input';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GraphQLResolveInfo } from 'graphql/type';
import { SignupValidationPipe } from './pipes/signup-validation.pipe';
import { User } from '../user/entities/user.entity';
import { CurrentUserType } from '../user/types/user.type';

@Resolver()
export class AuthResolver {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Mutation(() => AuthPayload, { name: 'signIn' })
  async logIn(
    @Args('email') email: string,
    @Args('password') password: string,
    @CurrentUser() user: CurrentUserType,
  ): Promise<{ access_token: string }> {
    try {
      return this.authService.generateToken(user);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new ApolloError('Failed to log in', 'INTERNAL_SERVER_ERROR');
    }
  }

  @UsePipes(new SignupValidationPipe())
  @Mutation(() => User, {
    name: 'signUp',
    nullable: true,
  })
  async signUp(
    @Args('createUserInput') createUserInput: CreateUserInput,
    @Info() info: GraphQLResolveInfo,
  ): Promise<User> {
    try {
      const isPasswordIncludeInExpectedResponseData =
        this.userService.isPasswordExpectedInResponseData(info);
      if (!isPasswordIncludeInExpectedResponseData) {
        return this.userService.create(createUserInput);
      }
      throw new BadRequestException(
        'The password field cannot be included in the response data',
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      } else {
        throw new ApolloError('Failed to sign up', 'INTERNAL_SERVER_ERROR');
      }
    }
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => MessageResponse, { name: 'signOut' })
  async signOut(@Context('req') req: any): Promise<{ message: string }> {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new ApolloError('No token provided', 'BAD_USER_INPUT');
    }
    try {
      await this.authService.invalidateToken(token);
      return { message: 'Sign out has been successfully' };
    } catch (error) {
      throw new ApolloError('Failed to sign out', 'INTERNAL_SERVER_ERROR');
    }
  }
}
