import {
  ExecutionContext,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { ApolloError } from 'apollo-server-express';
import { IAuthGuard } from './interfaces/auth.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements IAuthGuard {
  private request;

  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {
    super();
  }

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    this.request = request;
    return request;
  }

  // @ts-ignore
  async handleRequest(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): Promise<any> {
    if (err || !user) {
      throw new ApolloError('Unauthorized access', 'UNAUTHORIZED');
    }

    const token = this.request.headers.authorization?.split(' ')[1]; // Extract the token
    const isTokenInvalid = await this.authService.isTokenInvalid(token);

    if (!token || isTokenInvalid) {
      throw new ApolloError('Unauthorized access', 'UNAUTHORIZED');
    }

    return user;
  }
}
